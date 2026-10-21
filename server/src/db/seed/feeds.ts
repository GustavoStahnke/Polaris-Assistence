// Feeds RSS sugeridos. Todos foram testados (respondendo com notícias) em outubro de 2026.
export const SEED_FEEDS: Array<{ title: string; url: string; category: string }> = [
  { title: 'g1', url: 'https://g1.globo.com/rss/g1/', category: 'Brasil' },
  {
    title: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    category: 'Brasil',
  },
  { title: 'BBC News Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml', category: 'Brasil' },
  { title: 'Tecnoblog', url: 'https://tecnoblog.net/feed/', category: 'Tecnologia' },
  { title: 'Canaltech', url: 'https://canaltech.com.br/rss/', category: 'Tecnologia' },
  { title: 'Tecmundo', url: 'https://rss.tecmundo.com.br/feed', category: 'Tecnologia' },
  { title: 'Canaltech · IA', url: 'https://canaltech.com.br/rss/inteligencia-artificial/', category: 'IA' },
  {
    title: 'Olhar Digital · IA',
    url: 'https://olhardigital.com.br/tag/inteligencia-artificial/feed/',
    category: 'IA',
  },
  { title: 'g1 Economia', url: 'https://g1.globo.com/rss/g1/economia/', category: 'Economia' },
  { title: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/', category: 'Economia' },
  { title: 'Exame', url: 'https://exame.com/feed/', category: 'Economia' },
];
