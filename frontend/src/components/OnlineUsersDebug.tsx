// Caminho: frontend/src/components/OnlineUsersDebug.tsx

import { useChat } from "../contexts/ChatProvider";
import React from "react";

const OnlineUsersDebug: React.FC = () => {
  const { onlineUsers } = useChat();

  return (
    <div style={{
      position: "fixed",
      bottom: "10px",
      left: "10px",
      backgroundColor: "rgba(0,0,0,0.7)",
      color: "white",
      padding: "10px",
      borderRadius: "5px",
      zIndex: 9999,
      maxHeight: "200px",
      overflowY: "auto",
      fontSize: "12px"
    }}>
      <h3>Debug: Usuários Online ({onlineUsers.length})</h3>
      <pre>{JSON.stringify(onlineUsers, null, 2)}</pre>
    </div>
  );
};

export default OnlineUsersDebug;
