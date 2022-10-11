import React from 'react';
import Board from "../board";
import {EMPTY, NORMAL_RED, NORMAL_BLACK} from "../board";
import {RED_PLAYER} from "../board";

const BOARD_SIZE = 8;

class BoardController extends React.Component {
  constructor(props) {
    super(props);
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
      stateDisplay: "Inactive",
      victor: -1, // if not negative, game is over
    }
    this.props = props;
    this.id = this.props.id;
    this.socket = props.socket;
  }

  render() {
    return (
        <>
          <Board dataFromParent = {[this]} />
        </>
    );
  }

  componentDidMount() {
    this.socket.once('startGame', res => {
      this.setState(res.boardState, () => {
        this.setMessage('success',
          <>Rozpoczęto grę: {res.players[0]} vs. {res.players[1]}</>
        );
      });
    });
    this.socket.on('update', res => {
      this.setState(res.boardState, () => {
        this.clearMessage();
      });
    });
  }
  
  componentWillUnmount() {
    this.socket.off('update');
  }

  getSquareDisplay(row, column) {
    return this.state.squareDisplay[row][column];
  }

  getPlayerTurn() {
    return this.state.playerTurn;
  }
  
  getVictor() {
    return this.state.victor;
  }
  
  setMessage(type, msg) {
    if (this.props.setMessage != null) {
      this.props.setMessage(type, msg);
    }
  }

  clearMessage() {
    if (this.props.clearMessage != null) {
      this.props.clearMessage();
    }
  }

  clickedSquare(row, column) {
    if (!this.props.pushClicks) return;

    this.socket.emit('click', {id: this.id, row, column}, res => {
      if (res.state === 'error') {
        this.setMessage('danger', 'Error while clicking');
      } else {
        this.clearMessage();
      }
    });
  }
}

export default BoardController;
