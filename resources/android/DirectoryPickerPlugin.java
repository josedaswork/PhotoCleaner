package com.swipeclean.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DirectoryPicker")
public class DirectoryPickerPlugin extends Plugin {

    @PluginMethod()
    public void pick(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        startActivityForResult(call, intent, "handlePickResult");
    }

    @ActivityCallback
    private void handlePickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri treeUri = result.getData().getData();
            if (treeUri != null) {
                String path = extractPath(treeUri);
                JSObject ret = new JSObject();
                ret.put("path", path);
                ret.put("uri", treeUri.toString());
                call.resolve(ret);
                return;
            }
        }
        call.reject("No directory selected");
    }

    private String extractPath(Uri treeUri) {
        String docId = DocumentsContract.getTreeDocumentId(treeUri);
        // docId is like "primary:DCIM/Camera" for internal storage
        if (docId.startsWith("primary:")) {
            return docId.substring("primary:".length());
        }
        return docId;
    }
}
