package app

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func Start() {
	r := gin.Default()
	r.OPTIONS("/*any", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "*")
		c.JSON(204, gin.H{})
	})
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.POST("/api/canvas/save", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.JSON(200, gin.H{
			"message": "ok",
		})
		fmt.Println(c.Request.Body)
	})
	r.Run() // listen and serve on 0.0.0.0:8080
}
