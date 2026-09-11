package com.example.songbook.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.songbook.data.repository.SongRepository
import com.example.songbook.theme.SuccessGreen
import com.example.songbook.theme.WarningRed
import kotlinx.coroutines.launch

@Composable
fun ServerSettingsDialog(
    repository: SongRepository,
    onDismiss: () -> Unit
) {
    var serverUrl by remember { mutableStateOf(repository.getServerUrl()) }
    var testStatus by remember { mutableStateOf<Pair<Boolean, String>?>(null) }
    var isTesting by remember { mutableStateOf(false) }
    var isSyncing by remember { mutableStateOf(false) }
    var syncMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Dns, contentDescription = null, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Nastavení IP serveru")
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Zadejte IP adresu nebo URL vašeho backendového serveru (např. Docker na domácí síti nebo VPS):",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary
                )

                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = {
                        serverUrl = it
                        testStatus = null
                        syncMessage = null
                    },
                    label = { Text("URL / IP adresa serveru") },
                    placeholder = { Text("http://192.168.1.100:3000") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                // Test Connection Button & Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = {
                            isTesting = true
                            testStatus = null
                            scope.launch {
                                val res = repository.testConnection(serverUrl)
                                isTesting = false
                                testStatus = if (res.isSuccess) {
                                    Pair(true, res.getOrNull() ?: "Připojeno")
                                } else {
                                    Pair(false, res.exceptionOrNull()?.message ?: "Chyba připojení")
                                }
                            }
                        },
                        enabled = !isTesting && !isSyncing,
                        modifier = Modifier.height(38.dp)
                    ) {
                        if (isTesting) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Ověřuji...", fontSize = 13.sp)
                        } else {
                            Text("Test spojení", fontSize = 13.sp)
                        }
                    }

                    testStatus?.let { (success, msg) ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(start = 8.dp)
                        ) {
                            Icon(
                                if (success) Icons.Default.CheckCircle else Icons.Default.Error,
                                contentDescription = null,
                                tint = if (success) SuccessGreen else WarningRed,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = msg,
                                fontSize = 12.sp,
                                color = if (success) SuccessGreen else WarningRed,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Sync button
                FilledTonalButton(
                    onClick = {
                        isSyncing = true
                        syncMessage = null
                        scope.launch {
                            repository.setServerUrl(serverUrl)
                            val res = repository.syncWithServer(serverUrl)
                            isSyncing = false
                            if (res.isSuccess) {
                                val (songCount, plCount) = res.getOrNull() ?: Pair(0, 0)
                                syncMessage = "Úspěšně staženo $songCount písní a $plCount playlistů."
                            } else {
                                syncMessage = "Chyba synchronizace: ${res.exceptionOrNull()?.message}"
                            }
                        }
                    },
                    enabled = !isTesting && !isSyncing,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Stahuji data...")
                    } else {
                        Icon(Icons.Default.CloudDownload, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Synchronizovat se serverem")
                    }
                }

                syncMessage?.let { msg ->
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    repository.setServerUrl(serverUrl)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Text("Uložit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Zavřít")
            }
        }
    )
}
