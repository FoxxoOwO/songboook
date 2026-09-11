import axios from 'axios';
import * as cheerio from 'cheerio';

export interface UGSearchResult {
  title: string;
  artist: string;
  url: string;
  type: string;
  rating: number;
  votes: number;
}

export interface UGScrapedTab {
  title: string;
  artist: string;
  album?: string;
  key?: string;
  capo: number;
  content: string;
  url: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export async function searchUltimateGuitar(query: string): Promise<UGSearchResult[]> {
  try {
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const storeDiv = $('.js-store');
    if (!storeDiv.length) {
      return [];
    }

    const rawData = storeDiv.attr('data-content');
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);
    const results = parsed?.store?.page?.data?.results;
    if (!Array.isArray(results)) return [];

    return results
      .filter((r: any) => r.type === 'Chords' && r.tab_url)
      .slice(0, 15)
      .map((r: any) => ({
        title: r.song_name || 'Neznámý název',
        artist: r.artist_name || 'Neznámý interpret',
        url: r.tab_url,
        type: r.type || 'Chords',
        rating: Math.round((r.rating || 0) * 10) / 10,
        votes: r.votes || 0,
      }));
  } catch (err: any) {
    console.error('Error searching Ultimate Guitar:', err.message);
    return [];
  }
}

export async function scrapeUltimateGuitarTab(url: string): Promise<UGScrapedTab> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const storeDiv = $('.js-store');
    if (!storeDiv.length) {
      throw new Error('Nepodařilo se nalézt data skladby na stránce Ultimate Guitar.');
    }

    const rawData = storeDiv.attr('data-content');
    if (!rawData) {
      throw new Error('Prázdná data na stránce Ultimate Guitar.');
    }

    const parsed = JSON.parse(rawData);
    const pageData = parsed?.store?.page?.data;
    if (!pageData) {
      throw new Error('Neplatná struktura dat Ultimate Guitar.');
    }

    const tab = pageData.tab || {};
    const tabView = pageData.tab_view || {};
    const meta = tabView.meta || {};
    const wikiTab = tabView.wiki_tab || {};

    let rawContent: string = wikiTab.content || '';
    if (!rawContent) {
      throw new Error('Nenalezen žádný text akordů v tabu.');
    }

    // Convert UG chord formatting: [ch]Am[/ch] -> [Am]
    // and remove [tab] and [/tab] tags
    let cleanContent = rawContent
      .replace(/\[ch\](.*?)\[\/ch\]/gi, '[$1]')
      .replace(/\[tab\]/gi, '')
      .replace(/\[\/tab\]/gi, '');

    const capo = parseInt(meta.capo, 10) || 0;
    const key = meta.tonality || '';
    const title = tab.song_name || 'Neznámý název';
    const artist = tab.artist_name || 'Neznámý interpret';

    return {
      title,
      artist,
      capo,
      key,
      content: cleanContent,
      url,
    };
  } catch (err: any) {
    console.error('Error scraping Ultimate Guitar tab:', err.message);
    throw new Error(`Chyba při stahování z Ultimate Guitar: ${err.message}`);
  }
}
