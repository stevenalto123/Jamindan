package com.jamindan.emergency;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createEmergencyNotificationChannel();
    }

    private void createEmergencyNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "emergency_alert_channel";
            CharSequence name = "NDRRMC Emergency Alerts";
            String description = "High-priority disaster alerts with authentic siren sound";
            int importance = NotificationManager.IMPORTANCE_HIGH;

            NotificationChannel channel = new NotificationChannel(channelId, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{4000, 1000, 2000, 1000, 2000, 1000});

            try {
                Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.siren);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
                channel.setSound(soundUri, audioAttributes);
            } catch (Exception e) {
                e.printStackTrace();
            }

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
