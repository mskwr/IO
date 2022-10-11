
const { GameController,
  NORMAL_BLACK, NORMAL_RED, TARGET, EMPTY, CROWNED_RED, CROWNED_BLACK,
  RED_PLAYER, BLACK_PLAYER,
  CROWN_FLAG } = require('../game/gameImpl');

let game;

function clickAsActive(row, column) {
  game.clickSquare(row, column, game.getPlayerTurn());
}

function move(startRow, startColumn, targetRow, targetColumn) {
  expect(game.getSquare(targetRow, targetColumn)).toBe(EMPTY);
  switch (game.getSquare(startRow, startColumn)) {
    case NORMAL_RED:
      clickAsActive(startRow, startColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(TARGET);
      clickAsActive(targetRow, targetColumn);
      expect(game.getSquare(targetRow, targetColumn) & ~CROWN_FLAG).toBe(NORMAL_RED);
      expect(game.getSquare(startRow, startColumn)).toBe(EMPTY);
      break;
    case CROWNED_RED:
      clickAsActive(startRow, startColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(TARGET);
      clickAsActive(targetRow, targetColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(CROWNED_RED);
      expect(game.getSquare(startRow, startColumn)).toBe(EMPTY);
      break;
    case NORMAL_BLACK:
      clickAsActive(startRow, startColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(TARGET);
      clickAsActive(targetRow, targetColumn);
      expect(game.getSquare(targetRow, targetColumn) & ~CROWN_FLAG).toBe(NORMAL_BLACK);
      expect(game.getSquare(startRow, startColumn)).toBe(EMPTY);
      break;
    case CROWNED_BLACK:
      clickAsActive(startRow, startColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(TARGET);
      clickAsActive(targetRow, targetColumn);
      expect(game.getSquare(targetRow, targetColumn)).toBe(CROWNED_BLACK);
      expect(game.getSquare(startRow, startColumn)).toBe(EMPTY);
      break;
    case EMPTY:
      expect(game.getSquare(startRow, startColumn)).not.toBe(EMPTY);
    case TARGET:
      expect(game.getSquare(startRow, startColumn)).not.toBe(TARGET);
    default:
      const ANY_PIECE = NORMAL_RED
      expect(game.getSquare(startRow, startColumn)).toBe(ANY_PIECE);
  }
}

describe ("localMultiplayer tests", () => {
  beforeEach(() => {
    game = new GameController();
  });

  it('Clicking squares distinguishes players', () => {
    game.clickSquare(2, 3, BLACK_PLAYER);
    expect(game.getSquare(3, 4)).toBe(EMPTY);
    expect(game.getSquare(3, 2)).toBe(EMPTY);
    game.clickSquare(2, 3, RED_PLAYER);
    expect(game.getSquare(3, 4)).toBe(TARGET);
    expect(game.getSquare(3, 2)).toBe(TARGET);
  })

  test('Basic move test', () => {
    clickAsActive(2, 1);
    expect(game.getSquare(3, 2)).toBe(TARGET);
    expect(game.getSquare(3, 0)).toBe(TARGET);
    clickAsActive(3, 2);
    expect(game.getSquare(3, 0)).toBe(EMPTY);
    expect(game.getSquare(2, 1)).toBe(EMPTY);
    expect(game.getSquare(3, 2)).toBe(NORMAL_RED);
    clickAsActive(5, 0);
    expect(game.getSquare(4, 1)).toBe(TARGET);
    clickAsActive(4, 1);
    expect(game.getSquare(5, 0)).toBe(EMPTY);
    expect(game.getSquare(4, 1)).toBe(NORMAL_BLACK);
    clickAsActive(3, 2);
    // expect(game.getSquare(4, 3)).toBe(EMPTY);
    expect(game.getSquare(5, 0)).toBe(TARGET);
    clickAsActive(5, 0);
    expect(game.getSquare(3, 2)).toBe(EMPTY);
    expect(game.getSquare(4, 1)).toBe(EMPTY);
    expect(game.getSquare(5, 0)).toBe(NORMAL_RED);
  });

  test ('Side array overflows', () => {
    move(2, 1, 3, 0); // RED
    move(5, 6, 4, 7); // BLACK
    clickAsActive(3, 0); // Red left oveflow with move
    expect(game.getSquare(4, 1)).toBe(TARGET);
    move(2, 7, 3, 6); // RED | Red right oveflow with move
    clickAsActive(4, 7); // Black right oveflow with move
    move(5, 0, 4, 1); // BLACK | Black left oveflow with move
    move(3, 6, 4, 5); // RED | Red right overlfow with taking pieces
    move(5, 4, 3, 6); // BLACK
    move(1, 6, 2, 7); // RED
    clickAsActive(3, 6); // Black right overflow with taking pieces
    move(4, 1, 3, 2); // BLACK | Black left overflow with taking pieces
    move(2, 3, 4, 1); // RED
    move(6, 1, 5, 0); // BLACK | Black left overflow with taking pieces
    clickAsActive(4, 1); // Red left overflow with taking pieces
  });

  test('force largest taking', () => {
    move(2, 5, 3, 4); // RED
    move(5, 4, 4, 5); // BLACK
    move(2, 1, 3, 0); // RED
    move(6, 3, 5, 4); // BLACK
    move(1, 0, 2, 1); // RED
    move(5, 4, 4, 3); // BLACK
    move(2, 7, 3, 6); // RED
    clickAsActive(5, 0);
    expect(game.getSquare(4, 1)).toBe(EMPTY); // cannot move when taking is possible
    clickAsActive(5, 2);
    expect(game.getSquare(4, 1)).toBe(EMPTY); // cannot move when taking is possible
    clickAsActive(4, 5);
    expect(game.getSquare(2, 7)).toBe(EMPTY); // cannot take when larger taking is possible
  });

  test('Crowned test', () => {
    move(2, 1, 3, 0); // RED
    move(5, 0, 4, 1); // BLACK
    move(2, 3, 3, 2); // RED
    move(4, 1, 2, 3); // BLACK HIT
    move(1, 4, 3, 2); // RED HIT
    move(5, 4, 4, 5); // BLACK
    move(1, 2, 2, 3); // RED
    move(6, 3, 5, 4); // BLACK
    move(0, 3, 1, 4); // RED
    move(7, 2, 6, 3); // BLACK
    move(1, 0, 2, 1); // RED
    move(5, 2, 4, 1); // BLACK
    move(3, 2, 5, 0); // RED HIT
    move(5, 0, 7, 2); // RED CHAIN
    expect(game.getSquare(7, 2)).toBe(CROWNED_RED); // piece should be crowned
    move(6, 3, 5, 2); // BLACK
    clickAsActive(7, 2);
    expect(game.getSquare(6, 1)).toBe(TARGET);
    expect(game.getSquare(5, 0)).toBe(TARGET);
    expect(game.getSquare(6, 3)).toBe(TARGET);
    expect(game.getSquare(5, 4)).toBe(NORMAL_BLACK);
    expect(game.getSquare(3, 6)).toBe(EMPTY); // moves should not overreach
    move(2, 1, 3, 2); // RED
    move(5, 4, 4, 3); // BLACK
    clickAsActive(7, 2);
    expect(game.getSquare(3, 6)).toBe(EMPTY); // crown does not have priority over longer chains
    move(3, 2, 5, 4); // RED HIT
    move(5, 4, 3, 6); // RED CHAIN
    move(5, 2, 4, 3); // BLACK
    move(3, 6, 4, 7); // RED
    move(5, 6, 4, 5); // BLACK
    clickAsActive(7, 2);
    expect(game.getSquare(5, 4)).toBe(EMPTY); // place your targets right
    expect(game.getSquare(3, 6)).toBe(TARGET); // crown should be able to hit further
    clickAsActive(7, 0);
  });
});