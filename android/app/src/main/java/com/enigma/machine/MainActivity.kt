package com.enigma.machine

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.enigma.machine.ui.EnigmaScreen
import com.enigma.machine.ui.theme.EnigmaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EnigmaTheme {
                EnigmaScreen()
            }
        }
    }
}
