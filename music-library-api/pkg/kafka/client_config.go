package kafka

import (
	"crypto/tls"
	"strings"
	"time"

	kafkago "github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl"
	"github.com/segmentio/kafka-go/sasl/plain"
)

type ClientConfig struct {
	Brokers  string
	Topic    string
	Username string
	Password string
	TLS      bool
}

func (c ClientConfig) brokerList() []string {
	brokers := strings.Split(c.Brokers, ",")
	for i := range brokers {
		brokers[i] = strings.TrimSpace(brokers[i])
	}
	return brokers
}

func (c ClientConfig) tlsConfig() *tls.Config {
	if !c.TLS {
		return nil
	}
	return &tls.Config{MinVersion: tls.VersionTLS12}
}

func (c ClientConfig) saslMechanism() sasl.Mechanism {
	if c.Username == "" || c.Password == "" {
		return nil
	}
	return plain.Mechanism{
		Username: c.Username,
		Password: c.Password,
	}
}

func (c ClientConfig) writerTransport() *kafkago.Transport {
	return &kafkago.Transport{
		TLS:  c.tlsConfig(),
		SASL: c.saslMechanism(),
	}
}

func (c ClientConfig) readerDialer() *kafkago.Dialer {
	return &kafkago.Dialer{
		Timeout:       10 * time.Second,
		DualStack:     true,
		TLS:           c.tlsConfig(),
		SASLMechanism: c.saslMechanism(),
	}
}
