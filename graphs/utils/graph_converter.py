import networkx as nx

def networkx_to_d3_json(graph):
    """
    Chuyển đổi đồ thị NetworkX sang định dạng JSON cho D3.js
    """
    # Tạo danh sách nodes: [{'id': 0}, {'id': 1}, ...]
    nodes = [{"id": n} for n in graph.nodes()]
    
    # Tạo danh sách links: [{'source': 0, 'target': 1}, ...]
    links = [{"source": u, "target": v} for u, v in graph.edges()]
    
    return {
        "nodes": nodes,
        "links": links
    }