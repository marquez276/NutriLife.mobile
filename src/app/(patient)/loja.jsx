import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Screen, Card, Button, Input, Sheet, Badge, Icon, Select, Stars, Empty, Row } from "../../components/ui";
import { brl } from "../../utils";
import { c } from "../../theme";

const PRODUCTS = [
  { id: 1, name: "Whey Protein Concentrado", category: "Proteínas", brand: "ProFit", price: 89.9, oldPrice: 119.9, rating: 4.8, reviews: 324, stock: 45, description: "Whey protein de alta qualidade com 24g de proteína por dose.", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80" },
  { id: 2, name: "Creatina Monohidratada 300g", category: "Suplementos", brand: "MaxPower", price: 59.9, oldPrice: 79.9, rating: 4.9, reviews: 567, stock: 78, description: "Creatina pura para aumento de força e performance nos treinos.", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" },
  { id: 3, name: "Barra de Proteína Chocolate", category: "Lanches", brand: "FitBar", price: 6.9, oldPrice: 9.9, rating: 4.6, reviews: 189, stock: 156, description: "Barra proteica com 20g de proteína. Perfeita para lanches práticos.", image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80" },
  { id: 4, name: "Iogurte Proteico", category: "Lanches", brand: "YoPRO", price: 4.5, oldPrice: null, rating: 4.7, reviews: 423, stock: 234, description: "Iogurte grego com alta proteína e zero lactose.", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80" },
  { id: 5, name: "Hipercalórico Mass Gainer", category: "Suplementos", brand: "MegaMass", price: 119.9, oldPrice: 159.9, rating: 4.5, reviews: 267, stock: 32, description: "Suplemento hipercalórico para ganho de massa. 1200 calorias por dose.", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80" },
  { id: 6, name: "Mix de Castanhas Premium", category: "Lanches", brand: "NutriSnack", price: 24.9, oldPrice: 32.9, rating: 4.8, reviews: 512, stock: 89, description: "Mix selecionado de castanhas, amêndoas e nozes. Rico em gorduras boas.", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80" },
  { id: 7, name: "BCAA 2:1:1 - 120 cápsulas", category: "Suplementos", brand: "AminoMax", price: 49.9, oldPrice: 69.9, rating: 4.7, reviews: 298, stock: 67, description: "Aminoácidos essenciais para recuperação muscular.", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },
  { id: 8, name: "Sanduíche Natural de Frango", category: "Lanches", brand: "FreshLife", price: 12.9, oldPrice: null, rating: 4.4, reviews: 145, stock: 24, description: "Sanduíche natural com frango desfiado em pão integral.", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80" },
];

const ORDENS = [
  { value: "featured", label: "Destaques" }, { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" }, { value: "rating", label: "Mais Avaliados" },
];

export default function Loja() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("all");
  const [ordem, setOrdem] = useState("featured");
  const [favoritos, setFavoritos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produto, setProduto] = useState(null);
  const [painel, setPainel] = useState(null); // "favoritos" | "carrinho"

  const categorias = ["all", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const filtrados = PRODUCTS
    .filter(p => (p.name.toLowerCase().includes(busca.toLowerCase()) || p.brand.toLowerCase().includes(busca.toLowerCase())) && (categoria === "all" || p.category === categoria))
    .sort((a, b) => (ordem === "price-asc" ? a.price - b.price : ordem === "price-desc" ? b.price - a.price : ordem === "rating" ? b.rating - a.rating : 0));

  const alternarFavorito = (id) => setFavoritos(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const adicionar = (p) => setCarrinho(prev => (prev.find(i => i.id === p.id) ? prev.map(i => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { ...p, qty: 1 }]));
  const mudarQtd = (id, delta) => setCarrinho(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter(i => i.qty > 0));
  const total = carrinho.reduce((s, i) => s + i.price * i.qty, 0);
  const qtdCarrinho = carrinho.reduce((s, i) => s + i.qty, 0);

  return (
    <Screen title="Loja NutriLife" subtitle="Suplementos e lanches saudáveis" back="/mais">
      <Row>
        <Button title={`Favoritos${favoritos.length ? ` (${favoritos.length})` : ""}`} icon="heart" variant="outline" style={{ flex: 1 }} onPress={() => setPainel("favoritos")} />
        <Button title={`Carrinho${qtdCarrinho ? ` (${qtdCarrinho})` : ""}`} icon="shopping-cart" style={{ flex: 1 }} onPress={() => setPainel("carrinho")} />
      </Row>

      <Input placeholder="Buscar produtos..." value={busca} onChangeText={setBusca} />
      <Select value={ordem} options={ORDENS} onChange={setOrdem} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {categorias.map(cat => (
          <Pressable key={cat} onPress={() => setCategoria(cat)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: categoria === cat ? c.green600 : "#fff", borderWidth: 1, borderColor: categoria === cat ? c.green600 : c.gray200 }}>
            <Text style={{ fontWeight: "600", fontSize: 13, color: categoria === cat ? "#fff" : c.gray700 }}>{cat === "all" ? "Todos" : cat}</Text>
          </Pressable>
        ))}
      </View>

      {filtrados.length === 0 ? <Empty text="Nenhum produto encontrado." /> : filtrados.map(p => {
        const desconto = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        const fav = favoritos.includes(p.id);
        return (
          <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
            <View>
              <Image source={{ uri: p.image }} style={{ width: "100%", height: 170, backgroundColor: c.gray100 }} />
              {desconto > 0 && <Badge text={`-${desconto}%`} tone="red" style={{ position: "absolute", top: 12, left: 12, backgroundColor: c.red500 }} />}
              <Pressable onPress={() => alternarFavorito(p.id)} style={{ position: "absolute", top: 10, right: 10, backgroundColor: "#fff", borderRadius: 999, padding: 8 }}>
                <Icon name="heart" size={18} color={fav ? c.red500 : c.gray400} />
              </Pressable>
              <Badge text={`${p.stock} em estoque`} tone="gray" style={{ position: "absolute", bottom: 10, left: 12, backgroundColor: "#fff" }} />
            </View>
            <View style={{ padding: 14, gap: 6 }}>
              <Text style={{ fontSize: 12, color: c.gray400 }}>{p.brand}</Text>
              <Text style={{ fontWeight: "700", color: c.gray900 }}>{p.name}</Text>
              <Row><Stars rating={p.rating} /><Text style={{ fontSize: 12, color: c.gray400 }}>({p.reviews})</Text></Row>
              <View>
                {p.oldPrice ? <Text style={{ fontSize: 12, color: c.gray400, textDecorationLine: "line-through" }}>{brl(p.oldPrice)}</Text> : null}
                <Text style={{ fontSize: 22, fontWeight: "800", color: c.green600 }}>{brl(p.price)}</Text>
              </View>
              <Row>
                <Button title="Adicionar" icon="shopping-cart" small style={{ flex: 1 }} onPress={() => adicionar(p)} />
                <Button title="Ver" variant="outline" small onPress={() => setProduto(p)} />
              </Row>
            </View>
          </Card>
        );
      })}

      <Sheet visible={!!produto} onClose={() => setProduto(null)} title="Detalhes do produto">
        {produto && (
          <>
            <Image source={{ uri: produto.image }} style={{ width: "100%", height: 220, borderRadius: 14, backgroundColor: c.gray100 }} />
            <Badge text={produto.category} tone="gray" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: c.gray900 }}>{produto.name}</Text>
            <Text style={{ color: c.gray400 }}>{produto.brand}</Text>
            <Row><Stars rating={produto.rating} /><Text style={{ color: c.gray500 }}>{produto.rating} ({produto.reviews})</Text></Row>
            <View>
              {produto.oldPrice ? <Text style={{ color: c.gray400, textDecorationLine: "line-through" }}>{brl(produto.oldPrice)}</Text> : null}
              <Text style={{ fontSize: 30, fontWeight: "800", color: c.green600 }}>{brl(produto.price)}</Text>
            </View>
            <Text style={{ color: c.gray600 }}>{produto.description}</Text>
            <Text style={{ fontSize: 12, color: c.gray400 }}>{produto.stock} unidades em estoque</Text>
            <Button title="Adicionar ao Carrinho" icon="shopping-cart" onPress={() => { adicionar(produto); setProduto(null); }} />
            <Button title={favoritos.includes(produto.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"} icon="heart" variant="outline" onPress={() => alternarFavorito(produto.id)} />
          </>
        )}
      </Sheet>

      <Sheet
        visible={painel === "favoritos"} onClose={() => setPainel(null)} title="Favoritos"
      >
        {PRODUCTS.filter(p => favoritos.includes(p.id)).length === 0
          ? <Empty text="Nenhum favorito." />
          : PRODUCTS.filter(p => favoritos.includes(p.id)).map(p => (
            <Row key={p.id} style={{ backgroundColor: c.gray50, borderRadius: 12, padding: 10, gap: 12 }}>
              <Image source={{ uri: p.image }} style={{ width: 56, height: 56, borderRadius: 10 }} />
              <View style={{ flex: 1 }}><Text style={{ fontWeight: "600" }}>{p.name}</Text><Text style={{ color: c.green600, fontWeight: "700" }}>{brl(p.price)}</Text></View>
            </Row>
          ))}
      </Sheet>

      <Sheet
        visible={painel === "carrinho"} onClose={() => setPainel(null)} title="Carrinho"
        footer={carrinho.length > 0 ? (
          <View style={{ flex: 1, gap: 10 }}>
            <Row style={{ justifyContent: "space-between" }}><Text style={{ fontWeight: "700" }}>Total</Text><Text style={{ fontSize: 20, fontWeight: "800", color: c.green600 }}>{brl(total)}</Text></Row>
            <Button title="Finalizar Compra" />
          </View>
        ) : null}
      >
        {carrinho.length === 0 ? <Empty text="Carrinho vazio." /> : carrinho.map(item => (
          <Row key={item.id} style={{ backgroundColor: c.gray50, borderRadius: 12, padding: 10, gap: 12, alignItems: "flex-start" }}>
            <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 10 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontWeight: "600" }}>{item.name}</Text>
              <Text style={{ color: c.green600, fontWeight: "700" }}>{brl(item.price * item.qty)}</Text>
              <Row>
                <Pressable onPress={() => mudarQtd(item.id, -1)} style={{ borderWidth: 1, borderColor: c.gray200, borderRadius: 6, padding: 5 }}><Icon name="minus" size={14} /></Pressable>
                <Text style={{ width: 24, textAlign: "center", fontWeight: "600" }}>{item.qty}</Text>
                <Pressable onPress={() => mudarQtd(item.id, 1)} style={{ borderWidth: 1, borderColor: c.gray200, borderRadius: 6, padding: 5 }}><Icon name="plus" size={14} /></Pressable>
              </Row>
            </View>
            <Pressable onPress={() => mudarQtd(item.id, -item.qty)} hitSlop={8}><Icon name="x" size={18} color={c.gray400} /></Pressable>
          </Row>
        ))}
      </Sheet>
    </Screen>
  );
}
