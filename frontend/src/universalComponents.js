import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar'
import {Container} from "react-bootstrap";
import Stack from "react-bootstrap/Stack";

class NavigationBar extends Component {
    constructor() {
        super();
        this.state = { loggedIn: false, username: 'Account' };
    }

    componentDidMount() {
        fetch("/api/auth/status", {
            credentials: "same-origin"
        })
            .then(async res => {
                let body = await res.json();
                console.log(body);
                this.setState({ loggedIn: body.loggedIn, username: body.nick });
            })
    }

    render() {
        if (this.state.loggedIn)
        {
            return (
                <>
                    <Stack gap={5}>
                        <Navbar bg="dark" expand="lg" variant="dark">
                            <Container>
                                <Navbar.Brand href='/'>Checkers<div className='home_return_marker'></div></Navbar.Brand>
                                <Navbar.Brand href='/account'>{this.state.username}</Navbar.Brand>
                            </Container>
                        </Navbar>
                    </Stack>
                </>
            );
        }
        else
        {
            return (
                <>
                    <Stack gap={5}>
                        <Navbar bg="dark" expand="lg" variant="dark">
                            <Container>
                                <Navbar.Brand href='/'>Checkers</Navbar.Brand>
                                <Navbar.Brand href='/logIn'>Log in</Navbar.Brand>
                            </Container>
                        </Navbar>
                    </Stack>
                </>
            );
        }
    }
}

export default NavigationBar;
