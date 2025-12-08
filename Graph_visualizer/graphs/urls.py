from django.urls import path
from .View.Home_view import home_page
from .View.Fleury_view import fleury_page, get_graph_data, get_pdf_text
from .View.Hierholzer_view import hierholzer_page, hierholzer_api
from .View.Ford_Fulkerson_view import ford_fulkerson_page, ford_fulkerson_api, get_ford_fulkerson_pdf
from graphs.View import BFS_view
from .View.DFS_view import dfs_visualize_view, get_dfs_data, get_dfs_pdf
from .View.Kruskal_view import kruskal_page, kruskal_api, get_pdf_text_kruskal
from .View.Prim_view import prim_page, prim_api, get_pdf_text_prim
from .View.Djkstra_View import dijkstra_page, dijkstra_api, get_pdf_text_dijkstra
from .View.Bellman_Ford_view import bellman_ford_page, bellman_ford_api, get_bellman_ford_pdf 
from .View.Bruteforce_view import bruteforce_page, bruteforce_api , get_pdf_text_bruteforce

urlpatterns = [
    path('', home_page, name='home'),

    path('fleury/', fleury_page, name='fleury_page'),
    path('hierholzer/', hierholzer_page, name='hierholzer_page'),
    path('ford_fulkerson/', ford_fulkerson_page, name='ford_fulkerson_page'),
    path('bfs/', BFS_view.bfs_page, name='bfs_page'),
    path('dfs/', dfs_visualize_view, name='dfs_view'),
    path('kruskal/', kruskal_page, name='kruskal_page'),
    path('prim/', prim_page, name='prim_page'),
    path('dijkstra/', dijkstra_page, name='dijkstra_page'),
    path('bellman_ford/', bellman_ford_page, name='bellman_ford_page'),
    
    path("api/fleury/", get_graph_data, {"algorithm": "fleury"}),

    path('api/graph/hierholzer/', hierholzer_api, name='api_graph_hierholzer'),
    path('brute_force/', bruteforce_page, name='brute_force_page'),


    path('api/graph/ford-fulkerson/', ford_fulkerson_api, name='ford_fulkerson_api'),
    path("api/ford_fulkerson_pdf/", get_ford_fulkerson_pdf, name="ford_fulkerson_pdf"),

    path('api/graph/bfs/', BFS_view.bfs_view, name='api_graph_bfs'),

    path('api/graph/dfs/', get_dfs_data, name='dfs_api'),
    path('api/dfs/pdf/', get_dfs_pdf, name='dfs_pdf_api'),

    path('api/graph/kruskal/', kruskal_api),
    path('api/graph/prim/', prim_api),
    path('api/graph/dijkstra/', dijkstra_api, name='dijkstra_api'),
    path('api/graph/bellman-ford/', bellman_ford_api, name='bellman_ford_api'),
    path('api/graph/bruteforce/', bruteforce_api, name='api_graph_bruteforce'),
    path('api/graph/get_pdf_text_bruteforce/', get_pdf_text_bruteforce),
    path('api/bellman_ford_pdf/', get_bellman_ford_pdf, name='bellman_ford_pdf'),

    path("api/pdf-text/", get_pdf_text, name="pdf_text"),
    path('api/pdf-text/kruskal/', get_pdf_text_kruskal),
    path('api/pdf-text/prim/', get_pdf_text_prim),
    path('api/pdf-text/dijkstra/', get_pdf_text_dijkstra),

    path('api/graph/<str:algorithm>/', get_graph_data, name='api_graph_data'),


    
]