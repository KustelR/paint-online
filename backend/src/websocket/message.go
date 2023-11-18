package mywsocket

import "github.com/gorilla/websocket"

type Message struct {
	Sender  *websocket.Conn
	Session *Session
	Msg     []byte
	Mt      int
}

type ExternalMsg struct {
	MsgType string
	Content any
}

type DrawMessage struct {
	MsgType string
	Content map[string]interface{}
}
