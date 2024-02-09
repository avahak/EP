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
        <Modal isOpen={isOpen} onRequestClose={onClose}>
            <h2>Add New Player (TODO)</h2>
            <h2>{`Team: ${team.teamName}, ${team.teamRole}`}</h2>
            <label>
                Player Name:
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                />
            </label>
            <button onClick={handleAddPlayer}>Add Player</button>
            <button onClick={onClose}>Cancel</button>
        </Modal>
    );
};
    
export default AddPlayerModal;
    