import './profil.css'
import No from '../../assets/no.png'
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu';
import { UidContext } from '../../components/AppContext';
import { useContext } from 'react';
import UpdateProfil from '../../components/Profil/UpdateProfil';

export default function Articles() {
    const uid = useContext(UidContext)

    return (
        <div>
            {uid ? (
                <div>
                    <Header />
                    <div className='profil-flex'>
                        <Menu />
                        <UpdateProfil />
                    </div>
                </div>
            ) : (
                <div className='login-false'>
                    <h1>Vous n'êtes pas connecté.</h1>
                    <img src={No} alt='Panneau interdit'/>
                    <h2><Link to='/'>Retour à la page de connexion</Link></h2>
                </div>
            )}
        </div>
    )
}