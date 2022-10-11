# Warcaby

Gambit Group

## Opis
Serwer do gry w warcaby będzie umożliwiał rozgrywkę w odmianę brazylijską warcabów z komputerem oraz z innymi użytkownikami przez sieć. Będzie również obsługiwał system rejestracji oraz ranking z realistycznie wyznaczoną punktacją Elo.

## Grupy użytkowników
Aplikacja będzie przeznaczona dla osób, które lubią warcaby, ale nie mają możliwości grać w realnym świecie, jak również tych, którzy chcą wykorzystać swój czas wolny na rozrywkę.

## Wymagania funkcjonalne
- Gra multiplayer przez sieć
- Gra z komputerem
- System kont
- System rankingowy

## Technologia
- Github
- Node.js -> React, Express
- Oracle SQL

W trakcie pracy dokonano zmiany z Javy ze Spring Boot na Node.js z Express.

## Wymagania niefunkcjonalne
- Aplikacja ma być dostępna dla użytkowników 24/7/365 średnio 99.69% czasu.
- Aplikacja może obsłużyć jednocześnie 10 użytkowników. Te osoby będą mogły znajdować się w różnych lokalizacjach.
- Aplikacja będzie odpowiadała na żądania użytkownika nie dłużej niż w ciągu 3s na komputerach o parametrach lepszych lub równych parametrom sprzętowi Dell Precision Tower 3620, Intel Xeon E3-1240 v6, 16GB RAM, nVidia Quadro P400 [GP107GL] (z LK MIMUW)
- Aplikacja będzie działać na przynajmniej 75% przeglądarkach.
- Zostanie zachowana neutralna kolorystyka aplikacji, niezagrażająca atakami epileptycznymi o podłożu wizualnym.
- Podczas zakładania kont do gry wieloosobowej nie będzie potrzeby podawania żadnych danych osobowych.
- Wszystkie błędy krytyczne aplikacji zostaną skutecznie naprawione w ciągu 48h roboczych.
- Wszyscy użytkownicy mogą zgłaszać błędy na dedykowany adres email. Wszystkie błędy aplikacji będą monitorowane. Monitorowany będzie sposób i czas ich naprawy.
- Aplikacja będzie bardzo łatwa i intuicyjna w użyciu.
- Zachowana będzie odporność na nieprawidłowe użycie aplikacji przez użytkowników.

## Architektura
Aplikacja składa się z frontendu i backendu napisanego za pomocą Node.js oraz bazy danych Oracle SQL. Backend komunikuje się z bazą danych za pomocą Knex.js, konstruktora zapytań i schematów SQL. Komunikacja frontend-backend jest synchroniczna i odbywa się protokołem HTTP.

Frontend będzie dostępny na serwerze Students na odpowiednim porcie i jest publiczny - każdy dysponujący linkiem może z niego bez autoryzacji korzystać. Frontend posiada modele odpowiadające odbieranym danym z backendu i elementy tworzone za pomocą wbudowanych i ogólnodostępnych komponentów.

Backend odwzorowuje relacje bazy danych odpowiednimi klasami z adnotacjami. Zapytania do bazy danych odbywają się przez framework Knex.js.

Baza danych Oracle SQL będzie zawierała tylko jedną prostą tabelę, potrzebną do tworzenia kont w przypadku gry multiplayer i zarządzania rankingiem:

CREATE TABLE Player (\
&emsp;nick varchar2(32) primary key,\
&emsp;password varchar2(200) not null,\
&emsp;elo int not null\
);

Hasła będą odpowiednio szyfrowane, a ranking ELO będzie liczony swoją standardową formułą z wartością bazową 1000 przy pomocy biblioteki PLCalc.
