package com.flexora.frameprocessors

import android.graphics.ImageFormat
import android.media.Image
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.max
import kotlin.math.min

class MoveNetFrameProcessorPlugin(
  proxy: VisionCameraProxy,
  options: Map<String, Any>?
) : FrameProcessorPlugin() {

  companion object {
    private const val INPUT_SIZE = 192
    private const val KEYPOINT_COUNT = 17
    private const val CHANNELS = 3
    private const val INPUT_BYTES = 1 * INPUT_SIZE * INPUT_SIZE * CHANNELS
  }

  private val interpreter: Interpreter =
    Interpreter(FileUtil.loadMappedFile(proxy.context, "movenet_lightning.tflite"))

  private val inputBuffer: ByteBuffer =
    ByteBuffer.allocateDirect(INPUT_BYTES).order(ByteOrder.nativeOrder())

  private val outputArray: Array<Array<Array<FloatArray>>> =
    Array(1) { Array(1) { Array(KEYPOINT_COUNT) { FloatArray(3) } } }

  override fun callback(frame: Frame, params: Map<String, Any>?): Any {
    val image = frame.image
    if (image.format != ImageFormat.YUV_420_888) {
      return emptyList<Map<String, Double>>()
    }

    fillInputFromYuv(image, frame.width, frame.height)
    interpreter.run(inputBuffer, outputArray)

    val keypoints = ArrayList<Map<String, Double>>(KEYPOINT_COUNT)
    for (index in 0 until KEYPOINT_COUNT) {
      val point = outputArray[0][0][index]
      keypoints.add(
        hashMapOf(
          "x" to point[1].toDouble(),
          "y" to point[0].toDouble(),
          "score" to point[2].toDouble()
        )
      )
    }
    return keypoints
  }

  private fun fillInputFromYuv(image: Image, srcWidth: Int, srcHeight: Int) {
    inputBuffer.rewind()

    val planes = image.planes
    val yPlane = planes[0]
    val uPlane = planes[1]
    val vPlane = planes[2]

    val yBuffer = yPlane.buffer
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer

    val yRowStride = yPlane.rowStride
    val yPixelStride = yPlane.pixelStride
    val uRowStride = uPlane.rowStride
    val uPixelStride = uPlane.pixelStride
    val vRowStride = vPlane.rowStride
    val vPixelStride = vPlane.pixelStride

    for (destY in 0 until INPUT_SIZE) {
      val srcY = destY * srcHeight / INPUT_SIZE
      val srcUvY = srcY / 2

      for (destX in 0 until INPUT_SIZE) {
        val srcX = destX * srcWidth / INPUT_SIZE
        val srcUvX = srcX / 2

        val yIndex = srcY * yRowStride + srcX * yPixelStride
        val uIndex = srcUvY * uRowStride + srcUvX * uPixelStride
        val vIndex = srcUvY * vRowStride + srcUvX * vPixelStride

        val y = yBuffer.get(yIndex).toInt() and 0xFF
        val u = uBuffer.get(uIndex).toInt() and 0xFF
        val v = vBuffer.get(vIndex).toInt() and 0xFF

        val c = y - 16
        val d = u - 128
        val e = v - 128

        val r = clamp((298 * c + 409 * e + 128) shr 8)
        val g = clamp((298 * c - 100 * d - 208 * e + 128) shr 8)
        val b = clamp((298 * c + 516 * d + 128) shr 8)

        inputBuffer.put(r.toByte())
        inputBuffer.put(g.toByte())
        inputBuffer.put(b.toByte())
      }
    }

    inputBuffer.rewind()
  }

  private fun clamp(value: Int): Int = max(0, min(255, value))
}
