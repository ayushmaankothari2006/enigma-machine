# Production ProGuard / R8 Rules for Enigma 96 Native Android Application

# Enable standard optimization passes
-optimizations !class/unboxing/enum/*,!code/allocation/variable

# Keep Kotlin runtime attributes and reflections
-keepattributes *Annotation*,InnerClasses,EnclosingMethod,Signature

# Keep core cryptographic data models
-keep class com.enigma.machine.engine.RotorId { *; }
-keep class com.enigma.machine.engine.ReflectorId { *; }
-keep class com.enigma.machine.engine.RotorSlot { *; }
-keep class com.enigma.machine.engine.RotorConfig { *; }
-keep class com.enigma.machine.engine.EncryptResult { *; }
-keep class com.enigma.machine.engine.SignalTrace { *; }
-keep class com.enigma.machine.engine.StepHistoryItem { *; }
-keep class com.enigma.machine.engine.SanitizeResult { *; }

# Allow R8 to aggressively inline and strip unused methods
-allowaccessmodification
-repackageclasses ''

# Compose compiler rules
-dontwarn androidx.compose.**
