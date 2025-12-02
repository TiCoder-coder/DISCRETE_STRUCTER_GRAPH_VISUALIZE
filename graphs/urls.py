from django.urls import path
from .View.Home_view import home_page
from .View.Fleury_view import fleury_page, get_graph_data, get_pdf_text
from .View.Hierholzer_view import hierholzer_page, hierholzer_api
from .View.Ford_Fulkerson_view import ford_fulkerson_page, ford_fulkerson_api, get_ford_fulkerson_pdf
from graphs.View import BFS_view
from .View.DFS_view import dfs_visualize_view, get_dfs_data, get_dfs_pdf
from .View.Kruskal_view import kruskal_page, kruskal_api, get_pdf_text_kruskal
from .View.Prim_view import prim_page, prim_api, get_pdf_text_prim

urlpatterns = [
    # --- HOME ---
    path('', home_page, name='home'),

    # --- PAGES (Giao diện) ---
    path('fleury/', fleury_page, name='fleury_page'),
    path('hierholzer/', hierholzer_page, name='hierholzer_page'),
    path('ford_fulkerson/', ford_fulkerson_page, name='ford_fulkerson_page'),
    path('bfs/', BFS_view.bfs_page, name='bfs_page'),
    path('dfs/', dfs_visualize_view, name='dfs_view'),
    path('kruskal/', kruskal_page, name='kruskal_page'),
    path('prim/', prim_page, name='prim_page'),

    # --- API SPECIFIC (Cụ thể - Phải đặt TRƯỚC API tổng quát) ---
    
    # 1. Fleury (Có vẻ dùng chung get_graph_data nhưng nếu có api riêng thì đặt ở đây)
    path("api/fleury/", get_graph_data, {"algorithm": "fleury"}),

    # 2. Hierholzer
    path('api/graph/hierholzer/', hierholzer_api, name='api_graph_hierholzer'),

    # 3. Ford-Fulkerson (Quan trọng: Đặt trên <str:algorithm>)
    path('api/graph/ford-fulkerson/', ford_fulkerson_api, name='ford_fulkerson_api'),
    path("api/ford_fulkerson_pdf/", get_ford_fulkerson_pdf, name="ford_fulkerson_pdf"),

    # 4. BFS
    path('api/graph/bfs/', BFS_view.bfs_view, name='api_graph_bfs'),

    # 5. DFS
    path('api/graph/dfs/', get_dfs_data, name='dfs_api'),
    path('api/dfs/pdf/', get_dfs_pdf, name='dfs_pdf_api'),

    # 6. Kruskal & Prim
    path('api/graph/kruskal/', kruskal_api),
    path('api/graph/prim/', prim_api),

    # --- API PDF GENERIC ---
    # Chỉ khai báo 1 lần duy nhất
    path("api/pdf-text/", get_pdf_text, name="pdf_text"),
    path('api/pdf-text/kruskal/', get_pdf_text_kruskal),
    path('api/pdf-text/prim/', get_pdf_text_prim),

    # --- API GENERIC (Tổng quát - Phải đặt CUỐI CÙNG) ---
    # Dòng này sẽ bắt tất cả các request 'api/graph/...' nào chưa được xử lý ở trên
    path('api/graph/<str:algorithm>/', get_graph_data, name='api_graph_data'),
]