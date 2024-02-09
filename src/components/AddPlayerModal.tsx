// AddPlayerModal.js
import { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Set the root element for accessibility

type AddPlayerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddPlayer: (newPlayerName: string) => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onAddPlayer }) => {
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
    