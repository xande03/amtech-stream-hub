```tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import api from '../services/api';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

const Home: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/produtos')
      .then(response => {
        setProdutos(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  const handleDetalhes = (id: number) => {
    navigate(`/detalhes/${id}`);
  };

  return (
    <Container>
      <Row>
        <Col md={12}>
          <h1>Produtos</h1>
        </Col>
      </Row>
      <Row>
        {produtos.map(produto => (
          <Col md={4} key={produto.id}>
            <Card>
              <Card.Body>
                <Card.Title>{produto.nome}</Card.Title>
                <Card.Text>{produto.descricao}</Card.Text>
                <Card.Text>Preço: R$ {produto.preco}</Card.Text>
                <Button variant="primary" onClick={() => handleDetalhes(produto.id)}>
                  Detalhes
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Home;
```
Essa tela de início (Home) exibe uma lista de produtos, com opção de visualizar detalhes de cada produto. A lista de produtos é carregada via API e exibida em cards. Cada card contém o nome, descrição e preço do produto, além de um botão para visualizar detalhes. Ao clicar no botão, o usuário é redirecionado para a tela de detalhes do produto.