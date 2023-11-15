package main

import (
	"fmt"
	"mywsocket"
	"os"

	"github.com/joho/godotenv"
)

func init() {
	if err := godotenv.Load(); err != nil {
		fmt.Println(err)
		fmt.Println("env is not loaded")
	}
}

func main() {
	port, _ := os.LookupEnv("PORT")
	server := mywsocket.StartServer(port)
	fmt.Println(server)
	var command string
	for {
		fmt.Scanln(&command)
		if command == "stop" {
			break
		}
		switch command {
		case "status":
			{
				fmt.Println(server)
			}
		}
	}
}
