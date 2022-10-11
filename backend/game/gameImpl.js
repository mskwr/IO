const JumpTree = require("./jumpTree");

const BOARD_SIZE = 8;
const STATENAME_MOVE = 'Moving freely';
const STATENAME_CAPTURE = 'Ready to capture';
const STATENAME_CHAIN = 'Continuing a jump chain';
const STATENAME_REDWIN = 'Game over! The red player won!'
const STATENAME_BLACKWIN = 'Game over! The black player won!'

const COLOR_FLAG = 1,
// Red -> 0, Black -> 1
    PIECE_FLAG = 2,
    CROWN_FLAG = 4,
    TARGET_FLAG = 8;

const EMPTY = 0,
    NORMAL_RED = PIECE_FLAG,
    NORMAL_BLACK = PIECE_FLAG | COLOR_FLAG,
    CROWNED_RED = PIECE_FLAG | CROWN_FLAG,
    CROWNED_BLACK = PIECE_FLAG | COLOR_FLAG | CROWN_FLAG,
    TARGET = TARGET_FLAG; // TARGET and EMPTY
const RED_PLAYER = 0,
    BLACK_PLAYER = COLOR_FLAG;

// works on both pieces and player turns
function isBlack(value) {
    return (value & COLOR_FLAG) === BLACK_PLAYER;
}
function isRed(value) {
    return (value & COLOR_FLAG) === RED_PLAYER;
}
// works only on pieces
function isPiece(value) {
    return (value & PIECE_FLAG) !== 0;
}
function isOpponent(value1, value2) {
    return (value1 & value2 & PIECE_FLAG) !== 0 && // do pieces exist on both sides?
        ((value1 ^ value2) & COLOR_FLAG) !== 0; // are the pieces of opposite colors?
}

function isOwnPiece(piece, player) {
  if (!isPiece(piece))
    return false;

  if (player === RED_PLAYER)
    return isRed(piece);
  else
    return isBlack(piece);
}

class GameController {
  constructor(onUpdate) {
    var states = [];
    for (var row = 0; row < BOARD_SIZE; ++row) {
      states.push([]);
      for (var column = 0; column < BOARD_SIZE; ++column) {
        var color = EMPTY;
        if (row < 3) {
          color = NORMAL_RED;
        }
        else if (BOARD_SIZE - row <= 3) {
          color = NORMAL_BLACK;
        }
        if((row+column)%2 === 0) {
          color = EMPTY;
        }
        states[row].push(color);
      }
    }
    this.state = {
      squareDisplay: states,
      playerTurn: RED_PLAYER,
      stateDisplay: STATENAME_MOVE,
      captureProgress: null, // if not null, currently continuing a jump sequence
      captureTrees: [], // else if this is not empty, then ready to capture
      // otherwise moving freely
      movingRow: 0,
      movingColumn: 0,
      victor: -1, // if not negative, game is over
    }

    // Note: updates are only needed for actions that might affect the board, state or current turn.
    this._update = onUpdate;
    this._hasUpdate = true;
  }
  
  update() {
    if (this._update != null && this._hasUpdate) {
      this._update(this.readState());
    }
    this._hasUpdate = false;
  }

  markForUpdate() {
    this._hasUpdate = true;
  }

  // Returns reduced state, only including the parts that are immediately relevant to clients.
  readState() {
    return {
      squareDisplay: this.state.squareDisplay,
      playerTurn: this.state.playerTurn,
      stateDisplay: this.state.stateDisplay,
      victor: this.state.victor,
    };
  }

  isInRange(row, column) {
    return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
  }

  getSquare(row, column) {
    return this.state.squareDisplay[row][column];
  }

  getPlayerTurn() {
    return this.state.playerTurn;
  }
  
  getVictor() {
    return this.state.victor;
  }

  switchTurn() {
    let thisState = this.state;
    thisState.playerTurn ^= COLOR_FLAG;
    this.markForUpdate();
  }

  setMoving(row, column) {
    let thisState = this.state;
    thisState.movingRow = row;
    thisState.movingColumn = column;
    // this.update(thisState);
  }

  refreshStateName() {
    let thisState = this.state;
    if (thisState.victor === RED_PLAYER) {
      thisState.stateDisplay = STATENAME_REDWIN;
    } else if (thisState.victor === BLACK_PLAYER) {
      thisState.stateDisplay = STATENAME_BLACKWIN;
    } else if (thisState.captureProgress != null) {
      thisState.stateDisplay = STATENAME_CHAIN;
    } else if (thisState.captureTrees.length > 0) {
      thisState.stateDisplay = STATENAME_CAPTURE;
    } else {
      thisState.stateDisplay = STATENAME_MOVE;
    }
    this.markForUpdate();
  }

  // Lists neighbors in direction dir (in [1, -1]).
  // Use to iterate over targets for normal moves.
  listMoveNeighbors(row, column, dir) {
    let out = [];
    if (row+dir < 0 || row+dir >= BOARD_SIZE) {
      return out;
    }

    for (let dx = -1; dx <= 1; dx += 2) {
      if (column+dx >= 0 && column+dx < BOARD_SIZE) {
        out.push([row+dir, column+dx]);
      }
    }
    return out;
  }

  // Lists move targets for piece, accounting for crown status.
  listMoveTargets(row, column) {
    let thisPiece = this.getSquare(row, column);
    if ((thisPiece & CROWN_FLAG) !== 0) {
      let targetList = [];
      for (let dy = -1; dy <= 1; dy += 2) {
        for (let dx = -1; dx <= 1; dx += 2) {
          let pos = [row+dy, column+dx];
          while (this.isInRange(...pos) && !isPiece(this.getSquare(...pos))) {
            const posCopy = [...pos];
            targetList.push(posCopy);
            pos[0] += dy;
            pos[1] += dx;
          }
        }
      }
      return targetList;
    } else {
      return this.listMoveNeighbors(row, column, isBlack(thisPiece)? -1 : 1)
        .filter(n => !isPiece(this.getSquare(...n)));
    }
  }

  // Lists directions where a hit can be performed.
  // Each entry is an object of form {victim, destination},
  // where the former refers to the field where the piece being hit would be
  // and the latter refers to where the attacking piece would end up if the hit occurred.
  // Use to iterate over targets for hits.
  listHitNeighbors(row, column) {
    let out = [];

    for (let dy = -1; dy <= 1; dy += 2) {
      for (let dx = -1; dx <= 1; dx += 2) {
        let destrow = row + 2 * dy;
        let destcol = column + 2 * dx;
        if (this.isInRange(destrow, destcol)) {
          out.push({
            victim: [row+dy, column+dx],
            destination: [destrow, destcol],
          });
        }
      }
    }
    return out;
  }

  resetProposedMoves() {
    var thisState = this.state;
    for (var row = 0; row < BOARD_SIZE; ++row) {
      for (var column = 0; column < BOARD_SIZE; ++column) {
        if ((this.getSquare(row, column) & TARGET_FLAG) !== 0) {
          thisState.squareDisplay[row][column] &= ~TARGET_FLAG;
        }
      }
    }
    this.markForUpdate();
  }

  // jumped is an 8x8 array of bools, marking pieces that have been jumped
  recurseJumpTree(row, column, jumped, thisPiece) {
    let tree = new JumpTree(row, column);
    
    this.listHitNeighbors(row, column).filter(e => {
      if (isPiece(this.getSquare(...e.destination)))
        return false;
      if (jumped[e.victim[0]][e.victim[1]])
        return false;
      return isOpponent(thisPiece, this.getSquare(...e.victim));
    }).forEach(e => {
      jumped[e.victim[0]][e.victim[1]] = true;
      tree.next.push(this.recurseJumpTree(...e.destination, jumped, thisPiece));
      jumped[e.victim[0]][e.victim[1]] = false;
    });
    return tree;
  }

  // Returns a JumpTree for the given piece
  calculateHitsAt(row, column) {
    let thisPiece = this.getSquare(row, column);

    let hitTree = new JumpTree(row, column);
    let visitArray = Array(8).fill(0).map(r => Array(8).fill(false));

    // Enumerating possible captures for kings
    // Note that kings only have unlimited range on free moves and first jumps, not chained jumps!
    for (let dy = -1; dy <= 1; dy += 2) {
      for (let dx = -1; dx <= 1; dx += 2) {
        let victimPos = [row+dy, column+dx];
        if ((thisPiece & CROWN_FLAG) !== 0) {
          while (this.isInRange(victimPos[0]+dy, victimPos[1]+dx)
              && !isPiece(this.getSquare(...victimPos))) {
            victimPos[0] += dy;
            victimPos[1] += dx;
          }
        }
        let destPos = [victimPos[0]+dy, victimPos[1]+dx];
        if (!this.isInRange(...destPos))
          continue; // destination out of range (or everything on the way was empty, for a crowned piece)
        if (isPiece(this.getSquare(...destPos)))
          continue; // can't jump to here
        if (!isOpponent(thisPiece, this.getSquare(...victimPos)))
          continue; // not an opponent piece that you're trying to capture

        visitArray[victimPos[0]][victimPos[1]] = true;
        hitTree.next.push(this.recurseJumpTree(...destPos, visitArray, thisPiece));
        visitArray[victimPos[0]][victimPos[1]] = false;
      }
    }
    return hitTree;
  }
  
  calculateHitsForSide(player) {
    let hitList = [];
    let maxDepth = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let column = 0; column < BOARD_SIZE; column++) {
        if (!isOwnPiece(this.getSquare(row, column), player)) {
          continue;
        }
        let pieceTree = this.calculateHitsAt(row, column);
        if (!pieceTree.isLeaf()) {
          hitList.push(pieceTree);
          let depth = pieceTree.getDepth();
          if (depth > maxDepth)
            maxDepth = depth;
        }
      }
    }
    let thisState = this.state;
    thisState.captureTrees = hitList.filter(tree => tree.pruneToDepth(maxDepth-1));
    thisState.captureProgress = null;
    this.markForUpdate();
  }

  // Display targets for successors of progress tree.
  displayTreeSuccessors(tree) {
    let thisState = this.state;
    for (let next of tree.next) {
      let [row, column] = next.pos;
      thisState.squareDisplay[row][column] = TARGET;
    }
    this.markForUpdate();
  }
  
  movePieceTo(row, column) {
    var thisState = this.state;
    var rowStep = 1;
    var columnStep = 1;
    if (row < thisState.movingRow) {
      rowStep = -1;
    }
    if (column < thisState.movingColumn) {
      columnStep = -1;
    }
    thisState.squareDisplay[row][column] = 
      thisState.squareDisplay[thisState.movingRow][thisState.movingColumn];

    while (thisState.movingRow !== row) {
      thisState.squareDisplay[thisState.movingRow][thisState.movingColumn] = EMPTY;

      thisState.movingRow += rowStep;
      thisState.movingColumn += columnStep;
    }

    // Formerly, switching turns was handled here
    this.markForUpdate();
  }

  shouldPromote(row, column) {
    let thisPiece = this.getSquare(row, column);
    if (!isOwnPiece(thisPiece, this.getPlayerTurn())) {
      return false;
    }
    if (this.getPlayerTurn() === RED_PLAYER) {
      return row === BOARD_SIZE-1;
    } else {
      return row === 0;
    }
  }

  canCurrentPlayerMove() {
    if (this.state.captureTrees.length > 0) return true;
    
    let movable = false;
    let player = this.getPlayerTurn();
    for (let i = 0; i < BOARD_SIZE; ++i) {
      for (let j = 0; j < BOARD_SIZE; ++j) {
        let thisPiece = this.getSquare(i, j);
        if (isOwnPiece(thisPiece, player) && this.listMoveTargets(i, j).length > 0) {
          movable = true;
        }
      }
    }
    return movable;
  }

  defeatPlayer() {
    let thisState = this.state;
    thisState.victor = (this.getPlayerTurn() ^ COLOR_FLAG);
    this.markForUpdate();
  }

  endTurn() {
    let thisState = this.state;
    let row = thisState.movingRow;
    let column = thisState.movingColumn;
    if (this.shouldPromote(row, column)) {
      thisState.squareDisplay[row][column] |= CROWN_FLAG;
    }
    this.markForUpdate();
    this.switchTurn();
    this.calculateHitsForSide(this.getPlayerTurn());
    if (!this.canCurrentPlayerMove()) {
      this.defeatPlayer();
    }
    this.refreshStateName();
  }

  // Handle clicking on target for the given JumpTree.
  handleCaptureTargetClick(row, column, tree) {
    this.resetProposedMoves();
    let dest = tree.next.filter(t => {
      return t.pos[0] === row && t.pos[1] === column;
    });
    if (dest.length > 0) {
      let destTree = dest[0];
      this.movePieceTo(...destTree.pos);
      if (destTree.isLeaf()) {
        // End of capture sequence!
        this.captureProgress = null;
        this.endTurn();
      } else {
        let thisState = this.state;
        thisState.captureProgress = destTree;
        this.refreshStateName();
      }
    }
  }

  clickSquare(row, column, player) {
    if (this.state.victor >= 0) return;
    if (this.state.playerTurn !== player) return;
    row = Math.round(row);
    column = Math.round(column);
    if (row < 0 || row > BOARD_SIZE) return;
    if (column < 0 || column > BOARD_SIZE) return;

    // console.log("Clicked (" + row + ',' + column + ")!");
    const clickedPiece = this.state.squareDisplay[row][column];
    if (this.state.captureProgress != null) {
      // Continuing a capture
      let origin = this.state.captureProgress.pos;
      this.resetProposedMoves();
      if (isPiece(clickedPiece)) {
        // Clicked on a piece, but is it the right one?
        if (origin[0] === row && origin[1] === column) {
          this.setMoving(row, column);
          this.displayTreeSuccessors(this.state.captureProgress);
        }
      } else if (clickedPiece === TARGET) {
        this.handleCaptureTargetClick(row, column, this.state.captureProgress);
      }
    } else if (this.state.captureTrees.length > 0) {
      // Ready to capture
      this.resetProposedMoves();
      if (isPiece(clickedPiece)) {
        let tree = this.state.captureTrees.filter(t => {
          return t.pos[0] === row && t.pos[1] === column;
        });
        if (tree.length > 0) {
          let currTree = tree[0];
          this.setMoving(row, column);
          this.displayTreeSuccessors(currTree);
        }
      } else if (clickedPiece === TARGET) {
        let tree = this.state.captureTrees.filter(t => {
          return t.pos[0] === this.state.movingRow &&
            t.pos[1] === this.state.movingColumn;
        });
        if (tree.length > 0) {
          this.handleCaptureTargetClick(row, column, tree[0]);
        }
      }
    } else {
      // Just moving. Freely.
      this.resetProposedMoves();
      if (isOwnPiece(clickedPiece, this.getPlayerTurn())) {
        this.setMoving(row, column);
        let thisState = this.state;
        this.listMoveTargets(row, column).forEach(target => {
          thisState.squareDisplay[target[0]][target[1]] = TARGET;
        });
        this.markForUpdate();
      } else if (clickedPiece === TARGET) {
        this.movePieceTo(row, column);
        this.endTurn();
      }
    }
    this.update();
  }
}

module.exports = {
  GameController,
  EMPTY, NORMAL_RED, NORMAL_BLACK, CROWNED_RED, CROWNED_BLACK,
  TARGET, RED_PLAYER, BLACK_PLAYER,
  PIECE_FLAG, COLOR_FLAG, CROWN_FLAG, TARGET_FLAG,
  BOARD_SIZE
};