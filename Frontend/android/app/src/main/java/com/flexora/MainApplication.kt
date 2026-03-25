package com.flexora

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.flexora.frameprocessors.MoveNetFrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class MainApplication : Application(), ReactApplication {
  companion object {
    private const val TAG = "MainApplication"
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(PosePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    Log.i(TAG, "Registering detectPose frame processor plugin")
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectPose") { proxy, options ->
      MoveNetFrameProcessorPlugin(proxy, options)
    }
    Log.i(TAG, "detectPose frame processor plugin registration complete")
    loadReactNative(this)
  }
}
