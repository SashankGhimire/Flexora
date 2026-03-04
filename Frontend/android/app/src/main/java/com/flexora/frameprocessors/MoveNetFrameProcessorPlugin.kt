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

class MoveNetFrameProcessorPlugin(
  proxy: VisionCameraProxy,
  options: Map<String, Any>?
) : FrameProcessorPlugin() {

  companion object {
    private const val INPUT_SIZE = 192
    private const val KEYPOINT_COUNT = 17
    private const val CHANNELS = 3
    private const val INPUT_BYTES = 1 * INPUT_SIZE * INPUT_SIZE * CHANNELS
    private const val FRAME_SKIP_INTERVAL = 2
    private val EMPTY_RESULT: List<Map<String, Double>> = emptyList()
  }

  private val interpreter: Interpreter =
    Interpreter(FileUtil.loadMappedFile(proxy.context, "movenet_lightning.tflite"))

  private val inputBuffer: ByteBuffer =
    ByteBuffer.allocateDirect(INPUT_BYTES).order(ByteOrder.nativeOrder())

  private val outputArray: Array<Array<Array<FloatArray>>> =
    Array(1) { Array(1) { Array(KEYPOINT_COUNT) { FloatArray(3) } } }

  private val reusableKeypoints: List<MutableMap<String, Double>> =
    List(KEYPOINT_COUNT) {
      hashMapOf(
        "x" to 0.0,
        "y" to 0.0,
        "score" to 0.0
      )
    }

  private var frameSkipCounter: Int = 0
  private var hasCachedResult: Boolean = false

  override fun callback(frame: Frame, params: Map<String, Any>?): Any {
    val image = frame.image
    try {
      if (image.format != ImageFormat.YUV_420_888) {
        return EMPTY_RESULT
      }

      if (frame.width <= 0 || frame.height <= 0) {
        return EMPTY_RESULT
      }

      frameSkipCounter = (frameSkipCounter + 1) and Int.MAX_VALUE
      val shouldRunInferenceFrame = (frameSkipCounter % FRAME_SKIP_INTERVAL) == 0

      if (!shouldRunInferenceFrame) {
        return if (hasCachedResult) reusableKeypoints else EMPTY_RESULT
      }

      fillInputFromYuv(image, frame.width, frame.height)
      interpreter.run(inputBuffer, outputArray)

      for (index in 0 until KEYPOINT_COUNT) {
        val point = outputArray[0][0][index]
        val map = reusableKeypoints[index]
        map["x"] = point[1].toDouble()
        map["y"] = point[0].toDouble()
        map["score"] = point[2].toDouble()
      }

      hasCachedResult = true

      return reusableKeypoints
    } finally {
      try {
        image.close()
      } catch (_: Exception) {
      }
    }
  }

  private fun fillInputFromYuv(image: Image, srcWidth: Int, srcHeight: Int) {
    inputBuffer.clear()

    val planes = image.planes
    val yPlane = planes[0]

    val yBuffer = yPlane.buffer

    val yRowStride = yPlane.rowStride
    val yPixelStride = yPlane.pixelStride

    for (destY in 0 until INPUT_SIZE) {
      val srcY = destY * srcHeight / INPUT_SIZE

      for (destX in 0 until INPUT_SIZE) {
        val srcX = destX * srcWidth / INPUT_SIZE

        val yIndex = srcY * yRowStride + srcX * yPixelStride
        val y = yBuffer.get(yIndex)

        inputBuffer.put(y)
        inputBuffer.put(y)
        inputBuffer.put(y)
      }
    }

    inputBuffer.rewind()
  }
}
