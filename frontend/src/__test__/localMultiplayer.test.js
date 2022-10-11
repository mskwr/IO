
import React from 'react';
// import renderer from 'react-test-renderer';
import { render, screen, act } from '@testing-library/react';
import { NORMAL_BLACK, NORMAL_RED, TARGET, EMPTY, CROWNED_RED, CROWNED_BLACK, CROWN_FLAG } from '../board.js';
import LocalMultiplayer from '../localMultiplayer.js';
// import { shallow } from 'enzyme';

// let wrapper;
let game;

async function clickSquare(row, column) {
  return act(() => {
    game.clickedSquare(row, column);
  });
}

async function move(startRow, startColumn, targetRow, targetColumn) {
  expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(EMPTY);
  switch (game.getSquareDisplay(startRow, startColumn)) {
    case NORMAL_RED:
      await clickSquare(startRow, startColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(TARGET);
      await clickSquare(targetRow, targetColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn) & ~CROWN_FLAG).toBe(NORMAL_RED);
      expect(game.getSquareDisplay(startRow, startColumn)).toBe(EMPTY);
      break;
    case CROWNED_RED:
      await clickSquare(startRow, startColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(TARGET);
      await clickSquare(targetRow, targetColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(CROWNED_RED);
      expect(game.getSquareDisplay(startRow, startColumn)).toBe(EMPTY);
      break;
    case NORMAL_BLACK:
      await clickSquare(startRow, startColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(TARGET);
      await clickSquare(targetRow, targetColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn) & ~CROWN_FLAG).toBe(NORMAL_BLACK);
      expect(game.getSquareDisplay(startRow, startColumn)).toBe(EMPTY);
      break;
    case CROWNED_BLACK:
      await clickSquare(startRow, startColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(TARGET);
      await clickSquare(targetRow, targetColumn);
      expect(game.getSquareDisplay(targetRow, targetColumn)).toBe(CROWNED_BLACK);
      expect(game.getSquareDisplay(startRow, startColumn)).toBe(EMPTY);
      break;
    case EMPTY:
      expect(game.getSquareDisplay(startRow, startColumn)).not.toBe(EMPTY);
    case TARGET:
      expect(game.getSquareDisplay(startRow, startColumn)).not.toBe(TARGET);
    default:
      const ANY_PIECE = NORMAL_RED
      expect(game.getSquareDisplay(startRow, startColumn)).toBe(ANY_PIECE);
  }
}

function getMPInstance() {
  let instanceRef = { current: null };
  const MPWrapper = () => {
    return <LocalMultiplayer ref={instanceRef} />;
  };
  const view = render(<MPWrapper />);
  return { view, instanceRef };
}

describe ("localMultiplayer tests", () => {
  beforeEach(() => {
    // wrapper = shallow(<LocalMultiplayer />);
    // game = wrapper.instance();
    const mpRes = getMPInstance();
    game = mpRes.instanceRef.current;
  });

  it('Clicking squares works', async () => {
    const view = render(<LocalMultiplayer/>);
    expect(view).toMatchSnapshot();
    
    let squareButton = screen.getAllByRole('button');
    await act(() => {
      squareButton[0].click();
    })
    expect(view).toMatchSnapshot();
  })

  test('Basic move test', async () => {
    await clickSquare(2, 1);
    expect(game.getSquareDisplay(3, 2)).toBe(TARGET);
    expect(game.getSquareDisplay(3, 0)).toBe(TARGET);
    await clickSquare(3, 2);
    expect(game.getSquareDisplay(3, 0)).toBe(EMPTY);
    expect(game.getSquareDisplay(2, 1)).toBe(EMPTY);
    expect(game.getSquareDisplay(3, 2)).toBe(NORMAL_RED);
    await clickSquare(5, 0);
    expect(game.getSquareDisplay(4, 1)).toBe(TARGET);
    await clickSquare(4, 1);
    expect(game.getSquareDisplay(5, 0)).toBe(EMPTY);
    expect(game.getSquareDisplay(4, 1)).toBe(NORMAL_BLACK);
    await clickSquare(3, 2);
    // expect(game.getSquareDisplay(4, 3)).toBe(EMPTY);
    expect(game.getSquareDisplay(5, 0)).toBe(TARGET);
    await clickSquare(5, 0);
    expect(game.getSquareDisplay(3, 2)).toBe(EMPTY);
    expect(game.getSquareDisplay(4, 1)).toBe(EMPTY);
    expect(game.getSquareDisplay(5, 0)).toBe(NORMAL_RED);
  });

  test ('Side array overflows', async () => {
    await move(2, 1, 3, 0); // RED
    await move(5, 6, 4, 7); // BLACK
    await clickSquare(3, 0); // Red left oveflow with move
    expect(game.getSquareDisplay(4, 1)).toBe(TARGET);
    await move(2, 7, 3, 6); // RED | Red right oveflow with move
    await clickSquare(4, 7); // Black right oveflow with move
    await move(5, 0, 4, 1); // BLACK | Black left oveflow with move
    await move(3, 6, 4, 5); // RED | Red right overlfow with taking pieces
    await move(5, 4, 3, 6); // BLACK
    await move(1, 6, 2, 7); // RED
    await clickSquare(3, 6); // Black right overflow with taking pieces
    await move(4, 1, 3, 2); // BLACK | Black left overflow with taking pieces
    await move(2, 3, 4, 1); // RED
    await move(6, 1, 5, 0); // BLACK | Black left overflow with taking pieces
    await clickSquare(4, 1); // Red left overflow with taking pieces
  });

  test('force largest taking', async () => {
    await move(2, 5, 3, 4); // RED
    await move(5, 4, 4, 5); // BLACK
    await move(2, 1, 3, 0); // RED
    await move(6, 3, 5, 4); // BLACK
    await move(1, 0, 2, 1); // RED
    await move(5, 4, 4, 3); // BLACK
    await move(2, 7, 3, 6); // RED
    await clickSquare(5, 0);
    expect(game.getSquareDisplay(4, 1)).toBe(EMPTY); // cannot move when taking is possible
    await clickSquare(5, 2);
    expect(game.getSquareDisplay(4, 1)).toBe(EMPTY); // cannot move when taking is possible
    await clickSquare(4, 5);
    expect(game.getSquareDisplay(2, 7)).toBe(EMPTY); // cannot take when larger taking is possible
  });

  test('Crowned test', async () => {
    await move(2, 1, 3, 0); // RED
    await move(5, 0, 4, 1); // BLACK
    await move(2, 3, 3, 2); // RED
    await move(4, 1, 2, 3); // BLACK HIT
    await move(1, 4, 3, 2); // RED HIT
    await move(5, 4, 4, 5); // BLACK
    await move(1, 2, 2, 3); // RED
    await move(6, 3, 5, 4); // BLACK
    await move(0, 3, 1, 4); // RED
    await move(7, 2, 6, 3); // BLACK
    await move(1, 0, 2, 1); // RED
    await move(5, 2, 4, 1); // BLACK
    await move(3, 2, 5, 0); // RED HIT
    await move(5, 0, 7, 2); // RED CHAIN
    expect(game.getSquareDisplay(7, 2)).toBe(CROWNED_RED); // piece should be crowned
    await move(6, 3, 5, 2); // BLACK
    await clickSquare(7, 2);
    expect(game.getSquareDisplay(6, 1)).toBe(TARGET);
    expect(game.getSquareDisplay(5, 0)).toBe(TARGET);
    expect(game.getSquareDisplay(6, 3)).toBe(TARGET);
    expect(game.getSquareDisplay(5, 4)).toBe(NORMAL_BLACK);
    expect(game.getSquareDisplay(3, 6)).toBe(EMPTY); // moves should not overreach
    await move(2, 1, 3, 2); // RED
    await move(5, 4, 4, 3); // BLACK
    await clickSquare(7, 2);
    expect(game.getSquareDisplay(3, 6)).toBe(EMPTY); // crown does not have priority over longer chains
    await move(3, 2, 5, 4); // RED HIT
    await move(5, 4, 3, 6); // RED CHAIN
    await move(5, 2, 4, 3); // BLACK
    await move(3, 6, 4, 7); // RED
    await move(5, 6, 4, 5); // BLACK
    await clickSquare(7, 2);
    expect(game.getSquareDisplay(5, 4)).toBe(EMPTY); // place your targets right
    expect(game.getSquareDisplay(3, 6)).toBe(TARGET); // crown should be able to hit further
    await clickSquare(7, 0);
    await move(7, 2, 3, 6); // RED FAR HIT
  });
});