# Training Notes — WasteLens

## Model
- Architecture: ResNet18 (pretrained on ImageNet)
- Transfer learning: frozen backbone except layer4 + custom FC head (512 → 6)

## Hyperparameters
- Optimizer: Adam
- Learning rate: 0.001 (fc) / 0.0001 (layer4)
- Batch size: 32
- Max epochs: 15
- Early stopping patience: 3 (monitored on val_loss)

## Dataset
- Total images: 2527
- Split: 70% train / 15% val / 15% test (stratified, random_state=42)
- Transforms: RandomHorizontalFlip, RandomRotation(15), ColorJitter, Resize(224), ImageNet normalization

## Results
- Best val accuracy: 86.28% (epoch 4)
- Early stopping triggered at epoch 7

## Observations
- First attempt (FC only): 75.73% — model stuck in local minimum
- Fix: unfreezing layer4 with lower learning rate (0.0001) allowed better feature adaptation
- Result: +10.55% improvement on val accuracy