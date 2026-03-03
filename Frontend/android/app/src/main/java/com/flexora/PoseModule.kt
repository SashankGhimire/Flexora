package com.flexora

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.nio.ByteBuffer
import java.nio.ByteOrder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil

class PoseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var interpreter: Interpreter? = null

  override fun getName(): String = "PoseModule"

  @ReactMethod
  fun testModel(promise: Promise) {
    try {
      if (interpreter == null) {
        val modelBuffer = FileUtil.loadMappedFile(reactApplicationContext, "movenet_lightning.tflite")
        interpreter = Interpreter(modelBuffer)
      }

      val input = Array(1) { Array(192) { Array(192) { FloatArray(3) } } }
      val output = Array(1) { Array(1) { Array(17) { FloatArray(3) } } }

      interpreter?.run(input, output)

      val keypoints = Arguments.createArray()
      for (i in 0 until 17) {
        val keypoint = output[0][0][i]
        val keypointMap = Arguments.createMap()
        keypointMap.putDouble("x", keypoint[1].toDouble())
        keypointMap.putDouble("y", keypoint[0].toDouble())
        keypointMap.putDouble("score", keypoint[2].toDouble())
        keypoints.pushMap(keypointMap)
      }

      promise.resolve(keypoints)
    } catch (e: Exception) {
      promise.reject("MODEL_LOAD_ERROR", "Failed to load model: ${e.message}", e)
    }
  }

  @ReactMethod
  fun runInferenceFromImage(imagePath: String, promise: Promise) {
    try {
      if (interpreter == null) {
        val modelBuffer = FileUtil.loadMappedFile(reactApplicationContext, "movenet_lightning.tflite")
        interpreter = Interpreter(modelBuffer)
      }

      val normalizedPath = if (imagePath.startsWith("file://")) {
        imagePath.removePrefix("file://")
      } else {
        imagePath
      }

      val bitmap = BitmapFactory.decodeFile(normalizedPath)
      if (bitmap == null) {
        promise.reject("IMAGE_DECODE_ERROR", "Failed to decode image from path: $imagePath")
        return
      }

      val resizedBitmap = Bitmap.createScaledBitmap(bitmap, 192, 192, true)
      val input = ByteBuffer.allocateDirect(1 * 192 * 192 * 3)
      input.order(ByteOrder.nativeOrder())

      for (y in 0 until 192) {
        for (x in 0 until 192) {
          val pixel = resizedBitmap.getPixel(x, y)
          input.put(((pixel shr 16) and 0xFF).toByte())
          input.put(((pixel shr 8) and 0xFF).toByte())
          input.put((pixel and 0xFF).toByte())
        }
      }
      input.rewind()

      val output = Array(1) { Array(1) { Array(17) { FloatArray(3) } } }
      interpreter?.run(input, output)

      val keypoints = Arguments.createArray()
      for (i in 0 until 17) {
        val keypoint = output[0][0][i]
        val keypointMap = Arguments.createMap()
        keypointMap.putDouble("x", keypoint[1].toDouble())
        keypointMap.putDouble("y", keypoint[0].toDouble())
        keypointMap.putDouble("score", keypoint[2].toDouble())
        keypoints.pushMap(keypointMap)
      }

      promise.resolve(keypoints)
    } catch (e: Exception) {
      promise.reject("INFERENCE_ERROR", "Failed to run inference: ${e.message}", e)
    }
  }
}