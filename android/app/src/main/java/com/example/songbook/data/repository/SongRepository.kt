package com.example.songbook.data.repository

import android.content.Context
import com.example.songbook.data.model.Playlist
import com.example.songbook.data.model.Song
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class DatabaseWrapper(
    val songs: List<Song>,
    val playlists: List<Playlist>
)

class SongRepository(private val context: Context) {
    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
    }

    private val dbFile = File(context.filesDir, "songbook_db.json")

    private val _songs = MutableStateFlow<List<Song>>(emptyList())
    val songs: StateFlow<List<Song>> = _songs.asStateFlow()

    private val _playlists = MutableStateFlow<List<Playlist>>(emptyList())
    val playlists: StateFlow<List<Playlist>> = _playlists.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        if (dbFile.exists()) {
            try {
                val content = dbFile.readText()
                val parsed = json.decodeFromString<DatabaseWrapper>(content)
                _songs.value = parsed.songs
                _playlists.value = parsed.playlists
                return
            } catch (_: Exception) {
            }
        }
        // Fallback to initial seeds
        _songs.value = INITIAL_SONGS
        _playlists.value = INITIAL_PLAYLISTS
        saveData()
    }

    private fun saveData() {
        try {
            val wrapper = DatabaseWrapper(songs = _songs.value, playlists = _playlists.value)
            val text = json.encodeToString(wrapper)
            dbFile.writeText(text)
        } catch (_: Exception) {}
    }

    fun getSong(id: String): Song? {
        return _songs.value.find { it.id == id }
    }

    fun updateSong(updatedSong: Song) {
        val current = _songs.value.toMutableList()
        val index = current.indexOfFirst { it.id == updatedSong.id }
        if (index != -1) {
            current[index] = updatedSong
            _songs.value = current
            saveData()
        }
    }

    fun addSong(song: Song) {
        _songs.value = listOf(song) + _songs.value
        saveData()
    }

    fun deleteSong(id: String) {
        _songs.value = _songs.value.filter { it.id !== id }
        // Remove from playlists too
        _playlists.value = _playlists.value.map { pl ->
            pl.copy(song_ids = pl.song_ids.filter { it != id })
        }
        saveData()
    }

    fun createPlaylist(title: String, description: String = "", songIds: List<String> = emptyList()) {
        val newPl = Playlist(
            id = "pl-${System.currentTimeMillis()}",
            title = title,
            description = description,
            song_ids = songIds,
            created_at = System.currentTimeMillis().toString()
        )
        _playlists.value = _playlists.value + newPl
        saveData()
    }

    fun updatePlaylist(updatedPlaylist: Playlist) {
        val current = _playlists.value.toMutableList()
        val index = current.indexOfFirst { it.id == updatedPlaylist.id }
        if (index != -1) {
            current[index] = updatedPlaylist
            _playlists.value = current
            saveData()
        }
    }

    fun deletePlaylist(id: String) {
        _playlists.value = _playlists.value.filter { it.id != id }
        saveData()
    }

    companion object {
        val INITIAL_SONGS = listOf(
            Song(
                id = "stanky-brontosauri",
                title = "Stánky",
                artist = "Brontosauři / Jan Nedvěd",
                album = "Na kameni kámen",
                key = "G",
                capo = 0,
                tempo = 95,
                autoscroll_speed = 22,
                tags = listOf("táborák", "české", "folklór", "klasika"),
                youtube_url = "https://www.youtube.com/watch?v=kYJ5oQ1gN0k",
                spotify_url = "https://open.spotify.com/track/1a2b3c",
                content = """
{title: Stánky}
{artist: Brontosauři}

[G]U stánků [C]na levnou krásu,
[G]postávaj a [D]smějou se času,
[G]ujíždí jim [C]vlak, co právě [G]přijel, [D]a nikdo [G]neví.

[G]U stánků [C]na levnou krásu,
[G]postávaj a [D]smějou se času,
[G]ujíždí jim [C]vlak, co právě [G]přijel, [D]a nikdo [G]neví.

R:
Jen [C]zahlídli svět, maj na duši [D]vrásky,
tak [G]málo je, [Em]málo je lásky,
[G]ztracená víra hrozny z vinic [D]neoberou.

[G]Chtěli by [C]žít, jako ti druzí,
[G]v kabelkách [D]kousek mýdla a špínu,
[G]probudí tě [C]ráno a v [G]ústech zbylo [D]jenom slano.

R:
Jen [C]zahlídli svět, maj na duši [D]vrásky,
tak [G]málo je, [Em]málo je lásky,
[G]ztracená víra hrozny z vinic [D]neoberou.
                """.trimIndent()
            ),
            Song(
                id = "bedna-od-vodopadu",
                title = "Bedna od vodopádu",
                artist = "Miki Ryvola",
                album = "Zlatý klíč",
                key = "Am",
                capo = 0,
                tempo = 108,
                autoscroll_speed = 25,
                tags = listOf("táborák", "trampské", "české", "akustika"),
                youtube_url = "https://www.youtube.com/watch?v=abcxyz123",
                content = """
{title: Bedna od vodopádu}
{artist: Miki Ryvola}

[Am]Tak kopni do tý [C]bedny, ať [G]panstvo neče[Am]ká,
jsou dlouhý schody do nebe a [G]štreka dale[Am]ká.
Do nebeskýho báru, čas [C]kvapí, [G]už je [Am]čas,
tak kopni do tý bedny, ať [G]chytneš druhej [Am]dech!

R:
[Am]Mít tak všechny [C]prachy, co [G]jsem do chřtánu [Am]vlil,
mít tak všechny [C]holky, co [G]jsem s nima [Am]byl!
Jenže [C]člověk míní, [G]pánbůh [Am]mění,
a z [C]velký slávy [G]zbylo [Am]vření!

[Am]Tak kopni do tý [C]bedny, ať [G]panstvo neče[Am]ká,
jsou dlouhý schody do nebe a [G]štreka dale[Am]ká!
                """.trimIndent()
            ),
            Song(
                id = "wonderwall-oasis",
                title = "Wonderwall",
                artist = "Oasis",
                album = "(What's the Story) Morning Glory?",
                key = "Em",
                capo = 2,
                tempo = 87,
                autoscroll_speed = 20,
                tags = listOf("rock", "britpop", "anglické", "kytara"),
                youtube_url = "https://www.youtube.com/watch?v=bx1Bh8ZvH84",
                content = """
{title: Wonderwall}
{artist: Oasis}
{capo: 2}

[Em7]Today is [G]gonna be the day that they're [Dsus4]gonna throw it back to [A7sus4]you
[Em7]By now you [G]should've somehow rea[Dsus4]lised what you gotta [A7sus4]do
[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Cadd9]now [Dsus4] [A7sus4]

[Em7]Backbeat, the [G]word is on the street that the [Dsus4]fire in your heart is [A7sus4]out
[Em7]I'm sure you've [G]heard it all before, but you [Dsus4]never really had a [A7sus4]doubt
[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Em7]now [G] [Dsus4] [A7sus4]

[Cadd9]And all the [D]roads we have to walk are [Em7]winding
[Cadd9]And all the [D]lights that lead us there are [Em7]blinding
[Cadd9]There are many [D]things that I would [G]like to [D/F#]say to [Em7]you,
but I don't know [A7sus4]how

Chorus:
Because [Cadd9]maybe, [Em7] [G]
you're [Em7]gonna be the one that [Cadd9]saves me [Em7] [G]
And [Em7]after [Cadd9]all, [Em7] [G]
you're my [Em7]wonder[Cadd9]wall [Em7] [G] [Em7]
                """.trimIndent()
            ),
            Song(
                id = "hallelujah-leonard-cohen",
                title = "Hallelujah",
                artist = "Leonard Cohen",
                album = "Various Positions",
                key = "C",
                capo = 0,
                tempo = 60,
                autoscroll_speed = 18,
                tags = listOf("balada", "anglické", "klasika", "akustika"),
                youtube_url = "https://www.youtube.com/watch?v=ttEMYvpoR-k",
                content = """
{title: Hallelujah}
{artist: Leonard Cohen}

Now I've [C]heard there was a [Am]secret chord
That [C]David played, and it [Am]pleased the Lord
But [F]you don't really [G]care for music, [C]do you? [G]
It [C]goes like this, the [F]fourth, the [G]fifth
The [Am]minor fall, the [F]major lift
The [G]baffled king com[E7]posing Halle[Am]lujah

Chorus:
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah [G]

Your [C]faith was strong but you [Am]needed proof
You [C]saw her bathing [Am]on the roof
Her [F]beauty and the [G]moonlight over[C]threw you [G]
She [C]tied you to a [F]kitchen [G]chair
She [Am]broke your throne, and she [F]cut your hair
And [G]from your lips she [E7]drew the Halle[Am]lujah

Chorus:
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah
                """.trimIndent()
            )
        )

        val INITIAL_PLAYLISTS = listOf(
            Playlist(
                id = "taborak-playlist",
                title = "🔥 K táboráku a na chatu",
                description = "Nejlepší pecky k ohni na kytaru, co všichni znají zpaměti.",
                song_ids = listOf("stanky-brontosauri", "bedna-od-vodopadu")
            ),
            Playlist(
                id = "akustika-world",
                title = "🎸 Světová akustika",
                description = "Oblíbené mezinárodní akustické hity.",
                song_ids = listOf("wonderwall-oasis", "hallelujah-leonard-cohen")
            )
        )
    }
}
