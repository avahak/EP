// AddPlayerModal.js
import { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Set the root element for accessibility

type Team = {
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: string[];
    selectedPlayers: string[];
};

type AddPlayerModalProps = {
    isOpen: boolean;
    team: Team;
    onClose: () => void;
    onAddPlayer: (newPlayerName: string) => void;
};


const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, team, onClose, onAddPlayer }) => {
    const [newPlayerName, setNewPlayerName] = useState('');
    
    const handleAddPlayer = () => {
        if (newPlayerName.trim() === '') {
            return;
        }
        onAddPlayer(newPlayerName);
        onClose();
    };
    
    return (
        <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={{
            overlay: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
            content: {
            width: '300px',
            margin: 'auto',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
        }}
        >
        <div style={{ padding: '16px' }}>
            <h2 style={{ marginBottom: '16px' }}>Lisää pelaaja joukkueeseen {team.teamName} ({team.teamRole})</h2>
            <p style={{ marginBottom: '8px' }}></p>
            <label style={{ display: 'block', marginBottom: '8px' }}>
            Uuden pelaajan nimi:
            <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={handleAddPlayer} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Lisää pelaaja
            </button>
            <button onClick={onClose} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Peruuta
            </button>
            </div>
        </div>
        </Modal>
    );
};
    
export default AddPlayerModal;
    