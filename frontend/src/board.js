import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./board.css";

export const COLOR_FLAG = 1,
// Red -> 0, Black -> 1
    PIECE_FLAG = 2,
    CROWN_FLAG = 4,
    TARGET_FLAG = 8;

export const EMPTY = 0,
    NORMAL_RED = PIECE_FLAG,
    NORMAL_BLACK = PIECE_FLAG | COLOR_FLAG,
    CROWNED_RED = PIECE_FLAG | CROWN_FLAG,
    CROWNED_BLACK = PIECE_FLAG | COLOR_FLAG | CROWN_FLAG,
    TARGET = TARGET_FLAG; // TARGET and EMPTY
export const RED_PLAYER = 0,
    BLACK_PLAYER = COLOR_FLAG;

// works on both pieces and player turns
export function isBlack(value) {
    return (value & COLOR_FLAG) === BLACK_PLAYER;
}
export function isRed(value) {
    return (value & COLOR_FLAG) === RED_PLAYER;
}
// works only on pieces
export function isPiece(value) {
    return (value & PIECE_FLAG) !== 0;
}
export function isOpponent(value1, value2) {
    return (value1 & value2 & PIECE_FLAG) !== 0 && // do pieces exist on both sides?
        ((value1 ^ value2) & COLOR_FLAG) !== 0; // are the pieces of opposite colors?
}

class Square extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            row: props.dataFromParent[0],
            column: props.dataFromParent[1],
            board: props.dataFromParent[2],
        }
    }

    row () {
        return this.state.row;
    }

    column () {
        return this.state.column;
    }

    squareColor() {
        if ((this.row() + this.column()) % 2 === 0) {
            return "square whiteSquare";
        }
        else {
            return "square blackSquare";
        }
    }

    renderPiece() {
        switch(this.state.board.getPieceDisplay(this.row(), this.column())) {
            case TARGET: return (<img src="/img/target.png" alt="move target" className="piece"></img>);
            case NORMAL_RED: return (<img src="/img/redPiece.png" alt="red piece" className="piece"></img>);
            case NORMAL_BLACK: return (<img src="/img/blackPiece.png" alt="black piece" className="piece"></img>);
            case CROWNED_RED: return (<img src="/img/redCrownedPiece.png" alt="red crowned piece" className="piece"></img>);
            case CROWNED_BLACK: return (<img src="/img/blackCrownedPiece.png" alt="black crowned piece" className="piece"></img>);
            default: return <></>;
        }
    }

    render() {
        return (
            <button className={this.squareColor()} onClick={() => this.clicked()}>
                {this.renderPiece()}
            </button>
        );
    }

    clicked() {
        this.state.board.clickedSquare(this.row(), this.column());
    }
}

class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            gameHandler: props.dataFromParent[0],
        }
    }

    getPieceDisplay(row, column) {
        return this.state.gameHandler.getSquareDisplay(row, column);
    }

    renderSquare(row, column) {
        return <Square dataFromParent = {[row, column, this]} />;
    }

    renderRow(row) {
        return (
            <div className="row">
                {this.renderSquare(row, 0)}
                {this.renderSquare(row, 1)}
                {this.renderSquare(row, 2)}
                {this.renderSquare(row, 3)}
                {this.renderSquare(row, 4)}
                {this.renderSquare(row, 5)}
                {this.renderSquare(row, 6)}
                {this.renderSquare(row, 7)}
            </div>
        )
    }

    render() {
        return (
            <>
                <div className="board-square-outer">
                <div className="board-square-inner">
                <div className="board">
                    {this.renderRow(0)}
                    {this.renderRow(1)}
                    {this.renderRow(2)}
                    {this.renderRow(3)}
                    {this.renderRow(4)}
                    {this.renderRow(5)}
                    {this.renderRow(6)}
                    {this.renderRow(7)}
                </div>
                </div>
                </div>
                {this.displayStatusBar()}
            </>
        );
    }

    clickedSquare(row, column) {
        this.state.gameHandler.clickedSquare(row, column);
    }

    displayStatusBar() {
        return (
            <Container>
                <Row className="text-center justify-content-center">
                    {this.state.gameHandler.getVictor() < 0? <Col>
                        {this.displayPlayerTurn()}
                    </Col> : <></>}
                    <Col>
                        {this.state.gameHandler.state.stateDisplay}
                    </Col>
                </Row>
            </Container>
        )
    }

    displayPlayerTurn() {
        switch (this.state.gameHandler.getPlayerTurn()) {
            case RED_PLAYER:
                return (
                    <div>
                        <p>
                            Player turn:
                        </p>
                        <img src="/img/redPiece.png" alt="red player" className="playerIcon redPlayer"></img>
                    </div>
                );
            case BLACK_PLAYER:
                return (
                    <div>
                        <p>
                            Player turn:
                        </p>
                        <img src="/img/blackPiece.png" alt="black player" className="playerIcon blackPlayer"></img>
                    </div>
                );
            default:
                return <></>;
        }
    }
}

export default Board;