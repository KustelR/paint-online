package mywsocket

import (
	"fmt"
	"math/rand"
	"sync"

	"github.com/gorilla/websocket"
)

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const idLen = 32

type Sessions struct {
	mu         sync.RWMutex
	sessionMap map[string]*Session
}

func (s *Sessions) FindSession(id string) *Session {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.sessionMap[id]
}

func (s *Sessions) CreateSession(listeners []*websocket.Conn) (string, error) {
	byteId := make([]byte, 0, idLen)
	for i := 0; i < idLen; i++ {
		byteId = append(byteId, letters[rand.Intn(len(letters))])
	}
	identifier := string(byteId)
	if s.sessionMap[identifier] != nil {
		return "", fmt.Errorf("session %s already exists", identifier)
	}
	newSession := createSession()
	s.sessionMap[identifier] = &newSession
	for _, listener := range listeners {
		s.sessionMap[identifier].addClient(listener)
	}

	return identifier, nil
}

func (s *Sessions) DeleteSession(identifier string) error {
	s.mu.Lock()

	s.sessionMap[identifier].delete()
	delete(s.sessionMap, identifier)

	defer s.mu.Unlock()
	return nil
}

func (s *Sessions) AddListener(id string, listener *websocket.Conn) error {
	s.sessionMap[id].addClient(listener)

	return nil
}

func (s *Sessions) RemoveListener(id string, listener *websocket.Conn) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessionMap[id].removeClient(listener)
	return nil
}

func (s *Sessions) AddMessageHandler(id string, handler func(message Message)) {
	for {
		message := <-s.sessionMap[id].output
		handler(message)
	}
}
