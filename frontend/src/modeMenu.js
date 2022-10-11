import React from 'react';
import "./modeMenu.css";
import {Link} from "react-router-dom";

let localMultiplayerLink = "localMultiplayer"
let localGameLink = "";
let netGameLink = "netGame";

function ModeMenu() {
    return (
        <>
            <div className='modeMenu'>
                <Link className="menuLink" to={localGameLink}>Gra lokalna</Link>
                <Link className="menuLink" to={localMultiplayerLink}>Lokalny multiplayer </Link>
                <Link className="menuLink" to={netGameLink}>Gra przez sieć</Link>
            </div>
        </>
  );
  }
  
export default ModeMenu;
  

