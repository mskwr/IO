# Backend
To jest kod backendu aplikacji Warcaby. Napisany jest w Node.js z frameworkiem Express.
Bazę danych obsługuje przez Knex, obsługuje SQLite (do uruchamiania lokalnego i testowego) oraz Oracle Database (do ostatecznego uruchamiania).

Bazowy kod [autorstwa bezkodera](https://www.bezkoder.com/node-js-jwt-authentication-mysql/), pod (w domyśle?) licencją ISC.
Kod tego backendu odbiegł od podstawy na tyle, że wspólną z nim ma niemal wyłącznie strukturę.
JWT zastąpiono zapisywaniem stanu zalogowania w express-session.
Komunikacja zachodzi przez JSON, ale ze względu na obsługę sesji (chyba) nie jest całkowicie REST.

## Wymagania do uruchomienia
Należy odpowiednio ustawić pola pliku `load-secrets.sh`. Służy on do przekazywania danych tajnych do Node.js.
Jest też opcja podania własnych tajnych danych przez ustawienie odpowiednich zmiennych środowiskowych samemu.

## Architektura łącza socket.io
Przy połączeniu należy nadesłać ciasteczko sesji. Połączenia będą akceptowane tylko, jeśli łączy się zalogowany użytkownik.
Wszystkie zdarzenia mają przekać obiekt params jako jedyny parametr.

Rodzaje zdarzeń od klienta:

- `createGame`: tworzy grę, nadsyła ID gry po callbacku. Może być pusty obiekt. Jeśli params zawiera klucz `type: "private"`, musi być podany także klucz `username`, a pod nim nazwa użytkownika, który ma dołączyć. Wtedy dołączyć może jedynie wskazany użytkownik.
- `joinGame`: dołącza do istniejącej gry. Wymagany klucz `id`, gdzie ma być dane ID docelowej gry. Po dołączeniu obu stron gra się rozpoczyna. Odpowiada błędem (`state: "error"`), jeśli gracz nie ma tu wstępu.
- `click`: informuje o kliknięciu. Wtedy serwer obsługuje kliknięcie w lokalnej planszy od odpowiedniego gracza i wysyła stan zdarzeniem `update`. Klucze: `id` potwierdzające ID gry, `row` wskazujące wiersz, `column` wskazujące kolumnę.
- `depart`: informuje o celowym opuszczeniu gry. Wtedy gra jest przerywana. Do ustalenia, czy jest to przegrana, czy brak wyniku.

Na wszystkie zdarzenia od klienta serwer reaguje przez callback, z kluczem `state` o treści `ok`, `notice` lub `error`. Pierwsze dwa informują, że coś się powiodło, ale `notice` wskazuje drobny problem, z komunikatem zawartym w `message`. Z kolei `error` to błąd, też przekazujący komunikat w `message`. 

Rodzaje zdarzeń od serwera:

- `startGame`: rozpoczęcie gry. Przesyła wstępny stan. Wysyłane też rozpoczynającemu.
- `update`: aktualizacja stanu planszy. Zgodne ze stanem komponentu LocalMultiplayer, do obsługi przez Board. Wysyłane też klikającemu.
- `playerDisconnected`: informacja o odłączeniu się gracza, bez zakończenia gry. Przekazuje klucz `username` wskazujący, kto się odłączył.
- `playerConnected`: informacja o podłączeniu się gracza. Też przekazuje klucz `username`.
- `endGame`: informacja o końcu gry. Przez klucz `cause` przekazuje powód zakończenia – `timeout` to upłynięcie pewnego czasu od odłączenia się jednej strony (jeszcze nie ma obsługi przywracania po rozłączeniu, więc dzieje się to od razu), `victory` to zwycięstwo (nadsyłane też wykonawcy ostatniego ruchu), `depart` to odejście któregoś gracza (nadsyłane wszystkim innym).