package mywsocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Session struct {
	mu        sync.Mutex
	listeners map[*websocket.Conn]bool
	output    chan Message
}

func createSession() Session {
	return Session{listeners: make(map[*websocket.Conn]bool, 0), output: make(chan Message)}
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

func (s *Session) SendMessage(messageType int, message []byte) error {
	for listener := range s.listeners {
		listener.WriteMessage(messageType, message)
	}
	return nil
}

func (s *Session) delete() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for l := range s.listeners {
		l.Close()
	}
	return nil
}

func (s *Session) listen(conn *websocket.Conn, output chan Message) {
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil || mt == websocket.CloseMessage {
			s.removeClient(conn)
			break
		}
		message := Message{Sender: conn, Session: s, Msg: msg, Mt: mt}
		output <- message
	}
}

func Create() Sessions {
	return Sessions{sessionMap: make(map[string]*Session)}
}
