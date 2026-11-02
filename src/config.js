// Все личные детали меняются здесь. Видео положите в public/videos/.
// null означает, что деталь ещё не указана: сайт не придумывает её за вас.
export const invitation = {
  recipient: 'солнце',
  recipientGenitive: 'солнца',
  sender: 'Нурсултан',
  senderFrom: 'Нурсултана',
  day: '08',
  dateLabel: '8 ноября',
  month: 'ноября',
  weekday: 'воскресенье',
  artist: 'Best of NE PROSTO POP',
  venue: 'QAZAQCONCERT',
  address: 'пр. Мәңгілік ел, 10/1',
  city: 'Астана',
  time: '19:00',
  // Например: '2026-11-08T19:00:00+05:00'. Только после уточнения даты.
  startsAt: '2026-11-08T19:00:00+05:00',
  endsAt: '2026-11-08T21:00:00+05:00',
  timezone: 'Asia/Almaty',
  meetingVideo: '/videos/our-story.mp4',
  invitationVideo: '/videos/your-invitation.mp4',
  gameTrack: {
    title: 'like JENNIE',
    artist: 'JENNIE',
    // Официальный аудиофрагмент Apple Music, без копирования записи на хостинг.
    source: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/65/a3/5f/65a35f46-0983-2f74-8c2b-3cea8acb72c9/mzaf_3053932541022985158.plus.aac.p.m4a',
    link: 'https://music.apple.com/us/album/like-jennie/1795979743?i=1795979745',
  },
  message: 'Солнце, есть песни, которые хочется слушать снова. И есть человек, с которым хочется разделить этот вечер. Для меня это ты. Пойдём слушать любимые хиты в исполнении оркестра?',
}
