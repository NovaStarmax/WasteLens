from prometheus_client import Counter, Histogram

predictions_by_class = Counter(
    "wastelens_predictions_total",
    "Total predictions by waste class",
    ["predicted_class"]
)

confidence_scores = Histogram(
    "wastelens_confidence_score",
    "Confidence score distribution",
    buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
)
