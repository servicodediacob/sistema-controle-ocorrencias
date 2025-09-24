// Caminho: frontend/src/components/LoggedInUsersWidget.tsx (versão final)

import { useState, useEffect } from 'react'; // Removido React
import { useSocket } from '../hooks/useSocket';

interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
}

function LoggedInUsersWidget() {
  const [users, setUsers] = useState<LoggedInUser[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('update-logged-in-users', (userList: LoggedInUser[]) => {
        setUsers(userList);
      });

      return () => {
        socket.off('update-logged-in-users');
      };
    }
  }, [socket]);

  return (
    <div className="mt-6 w-full rounded-lg bg-gray-800 p-6 lg:mt-0">
      <h3 className="mt-0 border-b border-gray-700 pb-4 text-lg font-semibold">
        Usuários Online ({users.length})
      </h3>
      <div className="mt-4 max-h-60 overflow-y-auto">
        {users.length > 0 ? (
          <ul className="space-y-3">
            {users.map(user => (
              <li key={user.id} className="flex items-center gap-3">
                <span className="h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></span>
                <div>
                  <p className="font-semibold text-white">{user.nome}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-gray-500">Nenhum usuário online.</p>
        )}
      </div>
    </div>
  );
}

export default LoggedInUsersWidget;
