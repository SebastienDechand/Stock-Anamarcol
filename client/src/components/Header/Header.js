import './Header.css';
import Logo from '../../assets/Logo/logo_small.jpg'
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { UidContext } from '../AppContext';
import Logout from '../Logout/Logout';
import { useSelector } from 'react-redux';

export default function Header() {
    const uid = useContext(UidContext)
    const userData = useSelector((state) => state.userReducer)

    return (
        <div className='header'>
            
            <div className='header-menu'>
                <div className='header-btn'>
                    <Link to='/home' aria-label="Acceuil">
                        <img 
                            src={Logo}
                            alt='Logo AnaMarCol'
                            className='header-logo'
                        />
                    </Link>
                </div>
            </div>

            {uid ? (
                <div className='header-tools'>
                    <div className='header-welcome'>
                        <h5>Bienvenue {userData.pseudo}</h5>
                    </div>

                    <div className='header-icons'>
                        <Link to='/profil' aria-label="Profil utilisateur">
                        <img 
                            src={userData.picture}
                            alt='Employé'
                            className='header-pic'
                        />
                        </Link>
                        <Logout />
                    </div>
                </div>
            ) : (
                <div></div>
            )}
            
        </div>
    )
}