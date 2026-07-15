#!/bin/bash
set -e

APP_DIR=/data/coolify/applications/jqyfioyhsw3o739yrem1lb3g
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
LOG=/var/log/wastelens-deploy.log

echo "[$TIMESTAMP] Starting WasteLens model deployment" | tee -a $LOG

# Deploy model
mv /tmp/best_model.pt $APP_DIR/model/checkpoints/best_model.pt
MODEL_SIZE=$(du -sh $APP_DIR/model/checkpoints/best_model.pt | cut -f1)
echo "[$TIMESTAMP] Model deployed: best_model.pt ($MODEL_SIZE)" | tee -a $LOG

# Deploy reports
mkdir -p $APP_DIR/model/reports
mv /tmp/evaluation_report.json $APP_DIR/model/reports/evaluation_report.json
mv /tmp/confusion_matrix.png $APP_DIR/model/reports/confusion_matrix.png
REPORT_SIZE=$(du -sh $APP_DIR/model/reports/evaluation_report.json | cut -f1)
echo "[$TIMESTAMP] Reports deployed: evaluation_report.json ($REPORT_SIZE)" | tee -a $LOG

chown ubuntu:ubuntu $APP_DIR/model/checkpoints/best_model.pt
chown ubuntu:ubuntu $APP_DIR/model/reports/evaluation_report.json
chown ubuntu:ubuntu $APP_DIR/model/reports/confusion_matrix.png
chmod 644 $APP_DIR/model/checkpoints/best_model.pt
chmod 644 $APP_DIR/model/reports/evaluation_report.json
chmod 644 $APP_DIR/model/reports/confusion_matrix.png

# Restart API container
CONTAINER=$(docker ps --filter name=wastelens-api --format '{{.Names}}' | head -1)
if [ -n "$CONTAINER" ]; then
    docker restart "$CONTAINER"
    echo "[$TIMESTAMP] API container restarted: $CONTAINER" | tee -a $LOG
    echo "[$TIMESTAMP] Deployment complete ✅" | tee -a $LOG
else
    echo "[$TIMESTAMP] ERROR: No wastelens-api container found" | tee -a $LOG
    exit 1
fi
