import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { USERS_STORAGE_KEY } from '../constants';
import { UserPlus, LogIn, User } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: newUserName.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUserName}`
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    setNewUserName('');
    setView('list');
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-primary p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary font-bold text-3xl mx-auto mb-4 shadow-lg">
            N
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">NutriFun</h1>
          <p className="text-emerald-100">Votre compagnon nutrition intelligent</p>
        </div>

        <div className="p-8">
          {view === 'list' ? (
            <div className="space-y-6">
              <h2 className="text-center font-bold text-slate-700 text-xl">Qui mange aujourd'hui ?</h2>
              
              {users.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => onLogin(user)}
                      className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition group"
                    >
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                        alt={user.name}
                        className="w-16 h-16 rounded-full mb-3 bg-slate-100 group-hover:scale-110 transition-transform"
                      />
                      <span className="font-bold text-slate-700 group-hover:text-primary">{user.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">Aucun utilisateur enregistré</p>
              )}

              <button
                onClick={() => setView('create')}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition"
              >
                <UserPlus className="w-5 h-5" />
                Ajouter un utilisateur
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="text-center">
                <h2 className="font-bold text-slate-700 text-xl mb-2">Nouvel Utilisateur</h2>
                <p className="text-slate-400 text-sm">Créez votre profil pour commencer</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Votre Prénom</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Thomas"
                  className="w-full border-2 border-slate-200 rounded-xl p-4 focus:border-primary outline-none font-bold text-lg text-center"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newUserName.trim()}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition shadow-lg shadow-primary/20"
                >
                  C'est parti !
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
