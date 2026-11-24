package com.enigma.machine.utils

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.enigma.machine.engine.Alphabet
import com.enigma.machine.engine.RotorConfig
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Native Android PDF Exporter for Enigma 96.
 * Generates an elegant 3-page cryptographic audit document matching the web specification:
 * - Page 1: Machine Specifications & Rotor Key (Positions, Ring Offsets, Notches)
 * - Page 2: Plaintext Input Session
 * - Page 3: Ciphertext Output Session
 *
 * Saves directly into the device's Downloads folder and launches the system share/view intent.
 */
object PdfExporter {

    private const val PAGE_WIDTH = 595 // A4 width in points (72 dpi)
    private const val PAGE_HEIGHT = 842 // A4 height in points (72 dpi)
    private const val MARGIN = 36f
    private const val CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2)

    data class ExportResult(
        val success: Boolean,
        val filePath: String = "",
        val fileName: String = "",
        val uri: Uri? = null,
        val errorMessage: String? = null
    )

    fun exportAndShare(
        context: Context,
        leftRotor: RotorConfig,
        middleRotor: RotorConfig,
        rightRotor: RotorConfig,
        inputText: String,
        outputText: String
    ): ExportResult {
        val document = PdfDocument()

        val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm:ss", Locale.US)
        val fileDateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US)
        val now = Date()
        val timestampStr = dateFormat.format(now)
        val fileTimestamp = fileDateFormat.format(now)
        val fileName = "Enigma96_Session_$fileTimestamp.pdf"

        try {
            // ==========================================
            // PAGE 1: MACHINE SPECIFICATIONS & ROTOR KEY
            // ==========================================
            val page1Info = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 1).create()
            val page1 = document.startPage(page1Info)
            drawPage1(
                canvas = page1.canvas,
                timestamp = timestampStr,
                leftRotor = leftRotor,
                middleRotor = middleRotor,
                rightRotor = rightRotor
            )
            document.finishPage(page1)

            // ==========================================
            // PAGE 2: PLAINTEXT INPUT
            // ==========================================
            val page2Info = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 2).create()
            val page2 = document.startPage(page2Info)
            drawTextPage(
                canvas = page2.canvas,
                pageNumber = 2,
                title = "PAGE 2: PLAINTEXT INPUT SESSION",
                label = "PLAINTEXT INPUT",
                text = inputText,
                timestamp = timestampStr
            )
            document.finishPage(page2)

            // ==========================================
            // PAGE 3: CIPHERTEXT OUTPUT
            // ==========================================
            val page3Info = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 3).create()
            val page3 = document.startPage(page3Info)
            drawTextPage(
                canvas = page3.canvas,
                pageNumber = 3,
                title = "PAGE 3: CIPHERTEXT OUTPUT SESSION",
                label = "CIPHERTEXT OUTPUT",
                text = outputText,
                timestamp = timestampStr
            )
            document.finishPage(page3)

            // 1. Save to app cache dir for FileProvider sharing
            val cacheFile = File(context.cacheDir, fileName)
            FileOutputStream(cacheFile).use { fos ->
                document.writeTo(fos)
            }

            // 2. Save into system Downloads directory
            var savedUri: Uri? = null
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val resolver = context.contentResolver
                val downloadUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (downloadUri != null) {
                    resolver.openOutputStream(downloadUri)?.use { os ->
                        document.writeTo(os)
                    }
                    savedUri = downloadUri
                }
            } else {
                @Suppress("DEPRECATION")
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (downloadsDir.exists() || downloadsDir.mkdirs()) {
                    val publicFile = File(downloadsDir, fileName)
                    FileOutputStream(publicFile).use { fos ->
                        document.writeTo(fos)
                    }
                }
            }

            document.close()

            // 3. Obtain shareable Uri via FileProvider and launch Chooser
            val authority = "${context.packageName}.fileprovider"
            val shareUri = FileProvider.getUriForFile(context, authority, cacheFile)

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, shareUri)
                putExtra(Intent.EXTRA_SUBJECT, "Enigma 96 Cryptographic Session Export")
                putExtra(Intent.EXTRA_TEXT, "Exported Enigma 96 session document ($fileName).")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "Save or Open Enigma PDF").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)

            return ExportResult(
                success = true,
                filePath = cacheFile.absolutePath,
                fileName = fileName,
                uri = savedUri ?: shareUri
            )

        } catch (e: Exception) {
            document.close()
            return ExportResult(
                success = false,
                errorMessage = e.localizedMessage ?: "PDF Export failed"
            )
        }
    }

    private fun drawHeader(canvas: Canvas, pageNumber: Int, title: String, timestamp: String) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        // Blue brand banner
        paint.color = Color.rgb(29, 78, 216) // #1D4ED8
        canvas.drawRoundRect(
            RectF(MARGIN, MARGIN, MARGIN + CONTENT_WIDTH, MARGIN + 42f),
            8f, 8f, paint
        )

        // Brand title
        paint.color = Color.WHITE
        paint.typeface = Typeface.MONOSPACE
        paint.isFakeBoldText = true
        paint.textSize = 14f
        canvas.drawText("ENIGMA 96", MARGIN + 12f, MARGIN + 22f, paint)

        // Subtitle
        paint.color = Color.rgb(254, 215, 170) // Warm orange tint
        paint.textSize = 8.5f
        paint.isFakeBoldText = false
        canvas.drawText("MODERN 96-CHARACTER INVOLUTORY CIPHER ENGINE", MARGIN + 12f, MARGIN + 34f, paint)

        // Date right-aligned
        paint.color = Color.WHITE
        paint.textSize = 8f
        val dateWidth = paint.measureText(timestamp)
        canvas.drawText(timestamp, MARGIN + CONTENT_WIDTH - dateWidth - 12f, MARGIN + 26f, paint)

        // Section Title Banner
        paint.color = Color.rgb(241, 245, 249) // slate-100
        canvas.drawRoundRect(
            RectF(MARGIN, MARGIN + 50f, MARGIN + CONTENT_WIDTH, MARGIN + 76f),
            6f, 6f, paint
        )

        // Border around section banner
        paint.style = Paint.Style.STROKE
        paint.color = Color.rgb(203, 213, 225)
        paint.strokeWidth = 1f
        canvas.drawRoundRect(
            RectF(MARGIN, MARGIN + 50f, MARGIN + CONTENT_WIDTH, MARGIN + 76f),
            6f, 6f, paint
        )
        paint.style = Paint.Style.FILL

        // Section Title text
        paint.color = Color.rgb(30, 64, 175) // blue-900
        paint.textSize = 10f
        paint.isFakeBoldText = true
        canvas.drawText(title, MARGIN + 12f, MARGIN + 66f, paint)

        // Page Number Pill
        val pillWidth = 56f
        val pillHeight = 18f
        val pillLeft = MARGIN + CONTENT_WIDTH - pillWidth - 8f
        val pillTop = MARGIN + 54f
        paint.color = Color.rgb(234, 88, 12) // #EA580C
        canvas.drawRoundRect(
            RectF(pillLeft, pillTop, pillLeft + pillWidth, pillTop + pillHeight),
            pillHeight / 2, pillHeight / 2, paint
        )

        paint.color = Color.WHITE
        paint.textSize = 8f
        paint.isFakeBoldText = true
        val pageText = "PAGE $pageNumber/3"
        val textW = paint.measureText(pageText)
        canvas.drawText(pageText, pillLeft + (pillWidth - textW) / 2f, pillTop + 12f, paint)
    }

    private fun drawFooter(canvas: Canvas, pageNumber: Int) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val footerY = PAGE_HEIGHT - MARGIN

        // Divider
        paint.color = Color.rgb(226, 232, 240)
        paint.strokeWidth = 1f
        canvas.drawLine(MARGIN, footerY - 14f, MARGIN + CONTENT_WIDTH, footerY - 14f, paint)

        // Footer labels
        paint.color = Color.rgb(100, 116, 139)
        paint.textSize = 8f
        paint.typeface = Typeface.DEFAULT
        paint.isFakeBoldText = false
        canvas.drawText("Modern Enigma 96 • Cryptographic Session Document", MARGIN, footerY, paint)

        val pageLabel = "Page $pageNumber of 3"
        val labelW = paint.measureText(pageLabel)
        canvas.drawText(pageLabel, MARGIN + CONTENT_WIDTH - labelW, footerY, paint)
    }

    private fun drawPage1(
        canvas: Canvas,
        timestamp: String,
        leftRotor: RotorConfig,
        middleRotor: RotorConfig,
        rightRotor: RotorConfig
    ) {
        drawHeader(canvas, 1, "PAGE 1: MACHINE SPECIFICATIONS & ROTOR KEY", timestamp)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        var y = MARGIN + 94f

        // Overview Box
        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 64f), 8f, 8f, paint)

        paint.style = Paint.Style.STROKE
        paint.color = Color.rgb(219, 234, 254)
        paint.strokeWidth = 1f
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 64f), 8f, 8f, paint)
        paint.style = Paint.Style.FILL

        paint.color = Color.rgb(30, 64, 175)
        paint.typeface = Typeface.MONOSPACE
        paint.isFakeBoldText = true
        paint.textSize = 10f
        canvas.drawText("SYSTEM ARCHITECTURE & CRYPTOGRAPHIC PARAMETERS", MARGIN + 12f, y + 18f, paint)

        paint.color = Color.rgb(71, 85, 105)
        paint.textSize = 8.5f
        paint.isFakeBoldText = false
        canvas.drawText("• Alphabet: 96 Distinct ASCII/Extended Glyphs (Index 0: Space, 1..94: ASCII 33..126, 95: Enter)", MARGIN + 12f, y + 32f, paint)
        canvas.drawText("• Architecture: 3 Stepping Rotors with Odometer Stepping + Double-Stepping Pawl Mechanism", MARGIN + 12f, y + 44f, paint)
        canvas.drawText("• Involutory Symmetry: Reciprocal Encryption & Decryption with Zero Fixed Points", MARGIN + 12f, y + 56f, paint)

        y += 80f

        // Rotor Settings Table Title
        paint.color = Color.rgb(15, 23, 42)
        paint.typeface = Typeface.MONOSPACE
        paint.isFakeBoldText = true
        paint.textSize = 11f
        canvas.drawText("ROTOR CONFIGURATION & STARTING STATE", MARGIN, y, paint)

        y += 12f

        val rotors = listOf(
            Triple("Left Rotor (R1 • Slow)", leftRotor, Color.rgb(37, 99, 235)),
            Triple("Middle Rotor (R2 • Medium)", middleRotor, Color.rgb(234, 88, 12)),
            Triple("Right Rotor (R3 • Fast)", rightRotor, Color.rgb(37, 99, 235))
        )

        for ((slotLabel, rotor, accentColor) in rotors) {
            paint.color = Color.rgb(255, 255, 255)
            canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 68f), 8f, 8f, paint)

            paint.style = Paint.Style.STROKE
            paint.color = Color.rgb(226, 232, 240)
            paint.strokeWidth = 1f
            canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 68f), 8f, 8f, paint)
            paint.style = Paint.Style.FILL

            // Left colored stripe
            paint.color = accentColor
            canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + 6f, y + 68f), 3f, 3f, paint)

            // Rotor title
            paint.color = Color.rgb(15, 23, 42)
            paint.typeface = Typeface.MONOSPACE
            paint.isFakeBoldText = true
            paint.textSize = 10.5f
            canvas.drawText(slotLabel, MARGIN + 16f, y + 20f, paint)

            // Rotor Model
            paint.color = Color.rgb(100, 116, 139)
            paint.textSize = 8.5f
            paint.isFakeBoldText = false
            canvas.drawText("Model: ${rotor.id}   |   Turnover Notch: ${Alphabet.formatGlyph(rotor.turnoverNotch)} (${rotor.turnoverNotch + 1})", MARGIN + 16f, y + 34f, paint)

            // Position & Ring
            val posGlyph = Alphabet.formatGlyph(rotor.position)
            paint.color = Color.rgb(30, 64, 175)
            paint.isFakeBoldText = true
            paint.textSize = 9.5f
            canvas.drawText("Starting Position (P): $posGlyph (Index ${rotor.position + 1}/96)", MARGIN + 16f, y + 50f, paint)

            paint.color = Color.rgb(234, 88, 12)
            canvas.drawText("Ring Offset (R): ${rotor.ringSetting + 1}/96", MARGIN + 300f, y + 50f, paint)

            y += 76f
        }

        // Reflector specification
        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 42f), 8f, 8f, paint)
        paint.style = Paint.Style.STROKE
        paint.color = Color.rgb(226, 232, 240)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 42f), 8f, 8f, paint)
        paint.style = Paint.Style.FILL

        paint.color = Color.rgb(15, 23, 42)
        paint.isFakeBoldText = true
        paint.textSize = 9.5f
        canvas.drawText("Reflector Unit: Reflector A (Fixed Involutory Standard)", MARGIN + 14f, y + 18f, paint)

        paint.color = Color.rgb(100, 116, 139)
        paint.textSize = 8.5f
        paint.isFakeBoldText = false
        canvas.drawText("48 reciprocal pair mappings guaranteeing no character ever enciphers to itself.", MARGIN + 14f, y + 32f, paint)

        drawFooter(canvas, 1)
    }

    private fun drawTextPage(
        canvas: Canvas,
        pageNumber: Int,
        title: String,
        label: String,
        text: String,
        timestamp: String
    ) {
        drawHeader(canvas, pageNumber, title, timestamp)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        var y = MARGIN + 94f

        // Stats Box
        paint.color = Color.rgb(248, 250, 252)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 32f), 6f, 6f, paint)
        paint.style = Paint.Style.STROKE
        paint.color = Color.rgb(219, 234, 254)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + 32f), 6f, 6f, paint)
        paint.style = Paint.Style.FILL

        paint.color = Color.rgb(15, 23, 42)
        paint.typeface = Typeface.MONOSPACE
        paint.isFakeBoldText = true
        paint.textSize = 9f
        canvas.drawText("$label  —  TOTAL LENGTH: ${text.length} CHARACTERS", MARGIN + 12f, y + 20f, paint)

        y += 44f

        // Text Content Card
        val boxHeight = PAGE_HEIGHT - MARGIN - y - 26f
        paint.color = Color.WHITE
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + boxHeight), 8f, 8f, paint)
        paint.style = Paint.Style.STROKE
        paint.color = Color.rgb(226, 232, 240)
        canvas.drawRoundRect(RectF(MARGIN, y, MARGIN + CONTENT_WIDTH, y + boxHeight), 8f, 8f, paint)
        paint.style = Paint.Style.FILL

        // Draw Lines of text
        paint.color = Color.rgb(30, 41, 59)
        paint.typeface = Typeface.MONOSPACE
        paint.textSize = 8.5f
        paint.isFakeBoldText = false

        val lineHeight = 13f
        val maxLines = (boxHeight / lineHeight).toInt() - 2
        var currentY = y + 18f
        val leftX = MARGIN + 12f
        val maxTextWidth = CONTENT_WIDTH - 24f

        if (text.isEmpty()) {
            paint.color = Color.rgb(148, 163, 184)
            canvas.drawText("(Empty Session)", leftX, currentY, paint)
        } else {
            val lines = text.split("\n")
            var lineCount = 0

            for (rawLine in lines) {
                if (lineCount >= maxLines) {
                    paint.color = Color.rgb(234, 88, 12)
                    paint.isFakeBoldText = true
                    canvas.drawText("[... Output truncated to fit document boundaries ...]", leftX, currentY, paint)
                    break
                }

                if (rawLine.isEmpty()) {
                    currentY += lineHeight
                    lineCount++
                    continue
                }

                // Wrap text manually
                var start = 0
                while (start < rawLine.length && lineCount < maxLines) {
                    val count = paint.breakText(rawLine, start, rawLine.length, true, maxTextWidth, null)
                    val sub = rawLine.substring(start, start + count)
                    canvas.drawText(sub, leftX, currentY, paint)
                    currentY += lineHeight
                    lineCount++
                    start += count
                }
            }
        }

        drawFooter(canvas, pageNumber)
    }
}
