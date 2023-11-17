package mywsocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Session struct {
	identifier *string
	sessions   *Sessions
	mu         sync.Mutex
	listeners  map[*websocket.Conn]bool
	output     chan Message
}

func createSession(identifier *string, sessions *Sessions) Session {
	return Session{listeners: make(map[*websocket.Conn]bool, 0), output: make(chan Message), identifier: identifier, sessions: sessions}
}

func (s *Session) addClient(conn *websocket.Conn) error {
	s.mu.Lock()
	s.listeners[conn] = true
	go s.listen(conn, s.output)
	s.mu.Unlock()
	return nil
}

func (s *Session) removeClient(conn *websocket.Conn) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.listeners, conn)

	return nil
}

func (s *Session) SendMessage(message Message) error {
	messageType := message.Mt
	msg := message.Msg
	for listener := range s.listeners {
		if listener == message.Sender {
			continue
		}
		listener.WriteMessage(messageType, msg)
	}
	return nil
}

// CLoses all the connections and deletes the session from sessions
func (s *Session) Delete() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for l := range s.listeners {
		l.Close()
	}
	if s.sessions != nil {
		s.sessions.RemoveSession(*s.identifier)
	}
	return nil
}

func (s *Session) listen(conn *websocket.Conn, output chan Message) {
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil || mt == websocket.CloseMessage {
			s.removeClient(conn)
			if len(s.listeners) == 0 {
				s.Delete()
			}
			break
		}
		message := Message{Sender: conn, Session: s, Msg: msg, Mt: mt}
		output <- message
	}
}
