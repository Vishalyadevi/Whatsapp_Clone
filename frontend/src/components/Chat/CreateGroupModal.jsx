import React, { useState, useEffect } from 'react';
import { createGroup } from '../../api/groupService';
import { getAllUsers } from '../../api/userService';
import { X, ArrowRight, Check } from 'lucide-react';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName || selectedUsers.size === 0) return;
    try {
      const group = await createGroup({ name: groupName, members: Array.from(selectedUsers) });
      onGroupCreated(group);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1000, display: 'flex' }}>
      <div style={{ width: '400px', backgroundColor: '#f0f2f5', height: '100%', borderRight: '1px solid #d1d7db', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ height: '108px', backgroundColor: '#008069', color: 'white', display: 'flex', alignItems: 'flex-end', padding: '20px', gap: '20px' }}>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
          <h1 style={{ fontSize: '19px', fontWeight: 500 }}>{step === 1 ? 'Add group participants' : 'New group'}</h1>
        </div>
        
        {step === 1 ? (
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'white' }}>
            {users.filter(u => u.username).map(u => (
              <div key={u._id} onClick={() => toggleUser(u._id)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f2f2f2' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid #008069', marginRight: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: selectedUsers.has(u._id) ? '#008069' : 'white' }}>
                  {selectedUsers.has(u._id) && <Check size={14} color="white" />}
                </div>
                <div style={{ fontSize: '16px', color: '#111b21' }}>{u.username}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, backgroundColor: 'white', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#dfe5e7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: '#8696a0' }}>Group Icon</span>
              </div>
            </div>
            <input 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Subject"
              style={{ width: '100%', border: 'none', borderBottom: '2px solid #008069', paddingBottom: '8px', fontSize: '17px', outline: 'none' }}
            />
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {step === 1 && selectedUsers.size > 0 && (
            <div onClick={() => setStep(2)} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <ArrowRight size={24} color="white" />
            </div>
          )}
          {step === 2 && groupName && (
            <div onClick={handleCreate} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <Check size={24} color="white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
