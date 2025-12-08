# PROJECT DISCRETE SCTRUCTER --- GRAPH VISUALIZER — ỨNG DỤNG TRỰC QUAN HOÁ THUẬT TOÁN ĐỒ THỊ

![Picture](https://media.tapchikinhtetaichinh.vn/w1480/images/upload/tranhuyentrang/10012020/bmgrh-scaled.jpg)

## Giới thiệu

**Graph Visualizer** là một ứng dụng web xây dựng bằng **Django + MongoDB + D3.js**  
cho phép **trực quan hóa các thuật toán đồ thị** cổ điển như:

- **BFS / DFS** – Duyệt đồ thị theo chiều rộng & chiều sâu  
- **Prim / Kruskal** – Tìm cây khung nhỏ nhất (Minimum Spanning Tree)  
- **Ford–Fulkerson** – Tính luồng cực đại trong mạng  
- **Fleury / Hierholzer** – Tìm đường & chu trình Euler  

Ứng dụng cho phép:
- Hiển thị đồ thị động trên web bằng **D3.js**  
- Lưu trữ dữ liệu đồ thị và kết quả thuật toán bằng **MongoDB**  
- Chạy mô phỏng từng bước (animation) cho từng thuật toán  

--------------------------------------------------------------------------------------------------------------------------------------------
## Công nghệ sử dụng

| Thành phần         | Công nghệ                      | Vai trò                        |
|--------------------|--------------------------------|--------------------------------|
| **Backend**        | Django (Python 3.10)           | Điều phối & xử lý thuật toán   |
| **Database**       | MongoDB + Djongo               | Lưu trữ đồ thị và kết quả      |
| **Visualization**  | D3.js (v7)                     | Vẽ & mô phỏng đồ thị động      |
| **Graph Engine**   | NetworkX                       | Cấu trúc và tính toán đồ thị   |
| **Utility**        | python-decouple, python-dotenv | Bảo mật biến môi trường        |

--------------------------------------------------------------------------------------------------------------------------------------------

## Cấu trúc thư mục dự án
## <!-- 
    ├── 📁 Graph_visualizer
    │   ├── 📁 Graph_visualizer
    │   │   ├── 🐍 __init__.py
    │   │   ├── 🐍 asgi.py
    │   │   ├── 🐍 settings.py
    │   │   ├── 🐍 urls.py
    │   │   └── 🐍 wsgi.py
    │   ├── 📁 graphs                                                   (FOLDER CHỨA CÁC FILE DÙNG ĐỂ XỬ LÍ LOGIC CHO CÁC THUẬT TOÁN)
    │   │   ├── 📁 algorithms
    │   │   │   ├── 📁 bfs_dfs
    │   │   │   │   ├── 🐍 __init__.py
    │   │   │   │   ├── 🐍 bfs.py
    │   │   │   │   └── 🐍 dfs.py
    │   │   │   ├── 📁 fleury
    │   │   │   │   ├── 🐍 __init__.py
    │   │   │   │   └── 🐍 fleury.py
    │   │   │   ├── 📁 ford_fulkerson
    │   │   │   │   ├── 🐍 __init__.py
    │   │   │   │   └── 🐍 ford_fulkerson.py
    │   │   │   ├── 📁 hierholzer
    │   │   │   │   ├── 🐍 __init__.py
    │   │   │   │   └── 🐍 hierholzer.py
    │   │   │   ├── 📁 kruskal
    │   │   │   │   ├── 🐍 __init__.py
    │   │   │   │   └── 🐍 kruskal.py
    │   │   │   └── 📁 prim
    │   │   │       ├── 🐍 __init__.py
    │   │   │       └── 🐍 prim.py
    │   │   ├── 📁 migrations
    │   │   │   └── 🐍 __init__.py
    │   │   ├── 📁 static
    │   │   │   └── 📁 graphs
    │   │   │       └── 📁 js                                           (TRỰC QUAN HOÁ CÁC THUẬT TOÁN --- BƯỚC TRỰC QUAN HOÁ)
    │   │   │           ├── 📁 algorithms_d3
    │   │   │           │   ├── 📁 bfs_dfs
    │   │   │           │   │   └── 📄 bfs_d3.js
    │   │   │           │   ├── 📁 fleury
    │   │   │           │   │   └── 📄 fleury.js
    │   │   │           │   ├── 📁 ford_fulkerson
    │   │   │           │   │   └── 📄 ford_fulkerson.js
    │   │   │           │   ├── 📁 hierholzer
    │   │   │           │   │   └── 📄 hierholzer.js
    │   │   │           │   ├── 📁 kruskal
    │   │   │           │   │   └── 📄 kruskal.js
    │   │   │           │   └── 📁 prim
    │   │   │           │       └── 📄 prim.js
    │   │   │           └── 📁 d3
    │   │   ├── 📁 templates
    │   │   │   └── 📁 graphs
    │   │   │       └── 📁 algorithms_d3                                (TRỰC QUAN HOÁ CÁC THUẬT TOÁN --- BƯỚC VẼ CÁC THUẬT TOÁN)
    │   │   │           ├── 📁 bfs_dfs
    │   │   │           │   └── 🌐 bfs_d3.html
    │   │   │           ├── 📁 fleury
    │   │   │           │   └── 🌐 fleury.html
    │   │   │           ├── 📁 ford_fulkerson
    │   │   │           │   └── 🌐 ford_fulkerson.html
    │   │   │           ├── 📁 hierholzer
    │   │   │           │   └── 🌐 hierholzer.html
    │   │   │           ├── 📁 kruskal
    │   │   │           │   └── 🌐 kruskal.html
    │   │   │           └── 📁 prim
    │   │   │               └── 🌐 prim.html
    │   │   ├── 📁 utils                                                (FOLDER CHỨA CÁC HÀM TIỆN ÍCH)
    │   │   │   ├── 🐍 __init__.py
    │   │   │   ├── 🐍 file_handler.py                                      (Đọc/ghi file json)             
    │   │   │   ├── 🐍 graph_converter.py                                   (Chuyển đổi dữ liệu giữa NetworkX ↔ JSON ↔ D3.js)
    │   │   │   └── 🐍 save_results.py                                      (Các hàm dùng để lưu đồ thi và kết quả vào database)
    │   │   ├── 🐍 __init__.py
    │   │   ├── 🐍 admin.py
    │   │   ├── 🐍 apps.py
    │   │   ├── 🐍 models.py                                            (Lưu cấu trúc đồ thị (nodes, edges, trọng số, có hướng hay không))
    │   │   ├── 🐍 tests.py
    │   │   ├── 🐍 urls.py
    │   │   └── 🐍 views.py
    │   ├── 📁 media                                                    (Lưu các file vật lí)
    │   │   ├── 📁 images                                                   (Lưu ảnh trực quan hoá)
    │   │   └── 📁 saved_graphs                                             (Dữ liệu JSON cho đồ thị)
    │   ├── 🐍 manage.py ## -->

--------------------------------------------------------------------------------------------------------------------------------------------
## Luồng xử lí dữ liệu
1. Trình duyệt (frontend)
    → Gửi request đến Django API /api/graph/bfs/.

2. views.py
    → Tạo hoặc truy xuất đồ thị từ MongoDB.
    → Dùng networkx xử lý thuật toán BFS.
    → Chuẩn hóa dữ liệu bằng utils/graph_converter.py.
    → Trả JSON gồm: nodes, links, steps.

3. D3.js (frontend)
    → Nhận JSON đó, vẽ đồ thị bằng <svg>.
    → Mỗi bước trong steps được render thành animation tô màu.

4. (Tùy chọn)
    → utils/save_results.py lưu kết quả BFS (thứ tự duyệt) vào MongoDB.
    → Có thể export ra media/saved_graphs/bfs_result.json.

--------------------------------------------------------------------------------------------------------------------------------------------
## Mối quan hệ giữa các tầng
    [ Người dùng ]
        │
        ▼
    [ HTML + D3.js ]
        │  fetch("/api/graph/bfs/")
        ▼
    [ graphs/urls.py ]
        │
        ▼
    [ graphs/views.py → get_graph_data() ]
        │
        ├─ Gọi logic từ algorithms/bfs.py
        │
        ├─ Format JSON bằng utils/graph_converter.py
        │
        ▼
    [ Trả về JSON: nodes, links, steps ]
        │
        ▼
    [ D3.js render SVG, tô màu, animate ]

--------------------------------------------------------------------------------------------------------------------------------------------
## Cài đặt và cấu hình dự án

    - Tạo một môi trường ảo: python3 -m venv venv
    - Clone code và cấu hình
        git clone https://github.com/TiCoder-coder/GRAPH_VISUALIZER.git
        cd GRAPH_VISUALIZER
        pip install -r requirements.txt
    - Tải mongosh
    - Tạo một tài khoản admin riêng

--------------------------------------------------------------------------------------------------------------------------------------------
## Chạy

    python manage.py migrate
    python manage.py runserver

## Truy cập: http://127.0.0.1:8000/

--------------------------------------------------------------------------------------------------------------------------------------------

## Cách hoạt động của D3.js

    - D3.js đọc dữ liệu JSON từ API Django

    - Dùng forceSimulation() để vẽ layout đồ thị

    - Tô màu node / cạnh dựa trên từng bước trong mảng steps

    - Hiển thị trực quan quá trình thuật toán (duyệt, chọn cạnh, tính luồng, v.v.)

## Bảo mật

    - Tách toàn bộ thông tin nhạy cảm (DB, SECRET_KEY) vào .env

    - Không commit .env lên GitHub

    - Có thể bật xác thực MongoDB bằng user riêng trong DB admin

--------------------------------------------------------------------------------------------------------------------------------------------

🧑‍💻 Tác giả

👤 Vo Anh Nhat
📍 Đại học Giao thông vận tải
📧 Email: voanhnhat1612@gmail.com