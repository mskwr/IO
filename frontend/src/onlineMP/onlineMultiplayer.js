import React from 'react';
import "./onlineMultiplayer.css";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form } from 'react-bootstrap';

function OnlineMultiplayerMenu() {
  const navigate = useNavigate();
  const action = "/netGame/game";

  function handleSubmit(event) {
    console.log(event.target['type'].value);
    const form = event.target;
    const type = encodeURIComponent(form['type'].value);
    let param = '';
    if (type === 'join') {
      param = `&gameid=${encodeURIComponent(form['gameid'].value)}`;
    } else if (type === 'private') {
      param = `&user=${encodeURIComponent(form['user'].value)}`;
    }
    const target = `${action}?type=${type}${param}`;
    console.log(target);
    navigate(target);
    event.preventDefault();
  }

  return (
    <div className='onlineMP'>
      <Link className="menuLink" to="/netGame/game?type=public">Rozpocznij grę publiczną</Link>
      <Form action={action} onSubmit={handleSubmit}>
        <Form.Control type='hidden' id='type' value='private'></Form.Control>
        <Form.Group controlId='user' className='mb-3'>
          <Form.Label>Stwórz grę prywatną</Form.Label>
          <Form.Control placeholder='nazwa drugiego gracza'></Form.Control>
        </Form.Group>
        <Button variant='primary' type='submit'>Stwórz</Button>
      </Form>
      <Form action={action} onSubmit={handleSubmit}>
        <Form.Control type='hidden' id='type' value='join'></Form.Control>
        <Form.Group controlId='gameid' className='mb-3'>
          <Form.Label>Dołącz do gry</Form.Label>
          <Form.Control placeholder='ID gry'></Form.Control>
        </Form.Group>
        <Button variant='primary' type='submit'>Dołącz</Button>
      </Form>
    </div>
  );
}
  
export default OnlineMultiplayerMenu;
  

