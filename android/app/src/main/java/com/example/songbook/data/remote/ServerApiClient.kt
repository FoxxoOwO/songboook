package com.example.songbook.data.remote

import com.example.songbook.data.model.Playlist
import com.example.songbook.data.model.Song
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class ServerApiClient(private val json: Json) {

    suspend fun testConnection(baseUrl: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = formatBaseUrl(baseUrl) + "/api/health"
            val url = URL(cleanUrl)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 4000
                readTimeout = 4000
                requestMethod = "GET"
                setRequestProperty("Accept", "application/json")
            }
            val code = conn.responseCode
            if (code in 200..299) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val response = reader.readText()
                reader.close()
                Result.success("Úspěšně připojeno k serveru")
            } else {
                Result.failure(Exception("Server vrátil HTTP kód $code"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Nelze navázat spojení"))
        }
    }

    suspend fun fetchSongs(baseUrl: String): Result<List<Song>> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = formatBaseUrl(baseUrl) + "/api/songs"
            val response = getJson(cleanUrl)
            val songs = json.decodeFromString<List<Song>>(response)
            Result.success(songs)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchPlaylists(baseUrl: String): Result<List<Playlist>> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = formatBaseUrl(baseUrl) + "/api/playlists"
            val response = getJson(cleanUrl)
            val playlists = json.decodeFromString<List<Playlist>>(response)
            Result.success(playlists)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun getJson(urlString: String): String {
        val url = URL(urlString)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 6000
            readTimeout = 6000
            requestMethod = "GET"
            setRequestProperty("Accept", "application/json")
        }
        val code = conn.responseCode
        if (code in 200..299) {
            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val text = reader.readText()
            reader.close()
            return text
        } else {
            throw Exception("HTTP chyba $code")
        }
    }

    companion object {
        fun formatBaseUrl(input: String): String {
            var url = input.trim()
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "http://$url"
            }
            if (url.endsWith("/")) {
                url = url.substring(0, url.length - 1)
            }
            return url
        }
    }
}
