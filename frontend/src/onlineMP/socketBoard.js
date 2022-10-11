import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import './socketBoard.css';
import io from 'socket.io-client';
import _ from 'lodash';
import BoardController from './boardController';

class SocketBoardBase extends Component {
    constructor(props) {
        super(props);
        this.query = props.query;
        console.log(this.query.get('type'));
        this.state = {
            socket: null,
            hasError: false,
            cleanDisconnect: false, // If true, do not show error or hide board on disconnect
            pushClicks: true,
            active: false,
        };
    }

    componentDidMount() {
        this.setState({
            socket: io({
                path: '/api/socketio/',
                upgrade: false, // WebSocket refuses to cooperate, so we'll rely on long polling for now
            }),
            hasError: false,
            active: false,
        }, () => {
            this.state.socket.once('welcome', res => {
                console.log(`Welcome ${res.username}`);
            });
            
            this.state.socket.on('disconnect', res => {
                console.log(res);
                if (res === 'io server disconnect') {
                    this.overlayState({
                        active: this.state.cleanDisconnect,
                        pushClicks: false,
                        hasError: true,
                    }, () => {
                        if (!this.state.cleanDisconnect) {
                            this.setMessage('danger', 'Gniazdo rozłączone');
                        }
                    });
                }
            });

            if (this.query.get('type') === 'private') {
                this.state.socket.emit('createGame', {
                    type: 'private', username: this.query.get('user')
                }, res => {
                    if (res.state === 'error') {
                        this.state.socket.disconnect();
                        this.setMessage('danger', 'Błąd rozpoczynania gry prywatnej');
                    } else {
                        this.setID(res.id);
                    }
                });
            } else if (this.query.get('type') === 'join') {
                console.log('Join time');
                this.state.socket.emit('joinGame', {id: this.query.get('gameid')}, res => {
                    if (res.state === 'error') {
                        this.state.socket.disconnect();
                        this.setMessage('danger', 'Błąd dołączenia do gry');
                        console.log('Error: ', res.message);
                    } else {
                        console.log('Joining: ', res);
                        this.setID(res.id, true);
                    }
                });
            } else {
                this.state.socket.emit('createGame', {}, res => {
                    if (res.state === 'error') {
                        this.state.socket.disconnect();
                        this.setMessage('danger', 'Błąd rozpoczynania gry publicznej');
                    } else {
                        this.setID(res.id);
                    }
                });
            }

            this.state.socket.on('endGame', res => {
                let overlay = {cleanDisconnect: true};
                if (res.cause === 'depart') {
                    overlay.msgType = 'info';
                    overlay.message = 'Przeciwnik odszedł z gry';
                } else if (res.cause === 'timeout') {
                    overlay.msgType = 'warning';
                    overlay.message = 'Przeciwnik się rozłączył';
                } else if (res.cause === 'victory') {
                    overlay.msgType = 'success';
                    overlay.message = 'Koniec gry!';
                }
                this.overlayState(overlay);
            });
        });
    }

    overlayState(entries, cb) {
        let thisState = _.clone(this.state);
        for (let [k, v] of Object.entries(entries)) {
            thisState[k] = v;
        }
        this.setState(thisState, cb);
    }
    setMessage(type, msg) {
        let thisState = _.clone(this.state);
        thisState.hasError = true;
        thisState.msgType = type;
        thisState.message = msg;
        this.setState(thisState);
    }
    
    clearMessage() {
        let thisState = _.clone(this.state);
        console.log('Message cleared');
        thisState.hasError = false;
        this.setState(thisState);
    }

    setID(id, silent) {
        let thisState = _.clone(this.state);
        console.log(id);
        thisState.id = id;
        thisState.active = true;
        console.log('Ready to move out');
        this.setState(thisState, () => {
            if (silent) return;
            this.setMessage('success', <>
                Gra pod ID: <code className='shaded'>{id}</code>
            </>);
        });
    }
    
    setActive(active) {
        let thisState = _.clone(this.state);
        thisState.active = active;
        this.setState(thisState);
    }
    
    RenderError({show, variant, msg}) {
        if (show) {
            return <Alert variant={variant}>
                {msg}
            </Alert>;
        }
        return <></>;
    }
    
    RenderBoard({show, parent}) {
        if (show) {
            return <BoardController socket={parent.state.socket} id={parent.state.id}
                pushClicks={parent.state.pushClicks}
                setMessage={(t, m) => parent.setMessage(t, m)}
                clearMessage={() => parent.clearMessage()}/>;
        }
        return <></>;
    }

    componentWillUnmount() {
        this.state.socket.disconnect();
        console.log('SocketBoard unmounting');
    }
    
    render() {
        return <div className="socket-board">
            <this.RenderBoard show={this.state.active}
                parent={this} />
            <this.RenderError show={this.state.hasError}
                variant={this.state.msgType}
                msg={this.state.message} />
        </div>;
    }
}

function SocketBoard(props) {
    const location = useLocation();
    const getparams = new URLSearchParams(location.search);
    return <SocketBoardBase query={getparams}/>;
}

export default SocketBoard;