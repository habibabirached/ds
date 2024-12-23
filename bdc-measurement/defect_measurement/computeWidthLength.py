import numpy as np
from scipy.spatial import ConvexHull
from sklearn.decomposition import PCA
import plotly.graph_objects as go

def compute_pca_plane(points):
    """
    Compute the PCA plane and the major/minor axes for the polygon.

    Parameters:
        points (numpy.ndarray): An array of shape (n, 3) representing the 3D coordinates of the polygon vertices.

    Returns:
        pca (PCA): PCA object containing the components (axes).
        projected_points (numpy.ndarray): The 2D projection of the points onto the PCA plane.
    """
    pca = PCA(n_components=2)
    projected_points = pca.fit_transform(points)
    #print("projected_points = ", projected_points)
    return pca, projected_points

def compute_convex_hull_intersection(axis, convex_hull_points):
    """
    Compute the intersection of the convex hull along the major or minor axis.

    Parameters:
        axis (str): Either 'major' or 'minor', indicating the axis along which to compute the intersection length.
        convex_hull_points (numpy.ndarray): An array of shape (n, 2) representing the 2D convex hull points.

    Returns:
        intersection_length (float): The length of the intersection along the given axis.
    """
    # Use x-coordinates for major axis and y-coordinates for minor axis
    if axis == 'major':
        projected_values = convex_hull_points[:, 0]  # Use x-coordinates for major axis
    elif axis == 'minor':
        projected_values = convex_hull_points[:, 1]  # Use y-coordinates for minor axis
    else:
        raise ValueError("axis must be either 'major' or 'minor'")

    # Get the minimum and maximum projection values
    min_proj = projected_values.min()
    max_proj = projected_values.max()

    return max_proj - min_proj



def compute_polygon_dimensions(points):
    """
    Compute the width and length of a convex polygon in 3D space.

    Parameters:
        points (numpy.ndarray): An array of shape (n, 3) representing the 3D coordinates of the polygon vertices.

    Returns:
        widthAtCenterOfGravity (float): The width of the polygon at the center of gravity.
        widthAverage (float): The average width of the polygon.
        lengthAtCenterOfGravity (float): The length of the polygon at the center of gravity.
        lengthAverage (float): The average length of the polygon.
    """
    # Step 1: Compute the PCA plane and project points onto it
    pca, projected_points = compute_pca_plane(points)
    
    # Step 2: Compute the convex hull of the projected points
    convex_hull_points = projected_points

    # Step 3: Compute the length at the center of gravity along the major axis
    lengthAtCenterOfGravity = compute_convex_hull_intersection('major', convex_hull_points)
    
    # Step 4: Compute the width at the center of gravity along the minor axis
    widthAtCenterOfGravity = compute_convex_hull_intersection('minor', convex_hull_points)
    
    return widthAtCenterOfGravity, lengthAtCenterOfGravity, pca, projected_points

# def plot_polygon_and_pca(points, pca, projected_points):
#     """
#     Plot the 3D points, PCA plane, projected points, major/minor axes, and the convex hull.

#     Parameters:
#         points (numpy.ndarray): The original 3D points.
#         pca (PCA): PCA object containing the components (axes).
#         projected_points (numpy.ndarray): The 2D projection of the points onto the PCA plane.
#     """
#     # Plot the original 3D points
#     fig = go.Figure(data=[go.Scatter3d(
#         x=points[:, 0], y=points[:, 1], z=points[:, 2],
#         mode='markers',
#         marker=dict(size=5, color='blue'),
#         name='Original 3D Points'
#     )])

#     # Compute the PCA plane's normal using the cross product of major and minor axes
#     major_axis, minor_axis = pca.components_
#     plane_normal = np.cross(major_axis, minor_axis)
#     plane_point = np.mean(points, axis=0)
#     d = -plane_point.dot(plane_normal)
    
#     xx, yy = np.meshgrid(np.linspace(points[:, 0].min(), points[:, 0].max(), 10),
#                          np.linspace(points[:, 1].min(), points[:, 1].max(), 10))
#     zz = (-plane_normal[0] * xx - plane_normal[1] * yy - d) * 1. / plane_normal[2]

#     fig.add_trace(go.Surface(x=xx, y=yy, z=zz, name='PCA Plane', opacity=0.5, colorscale='gray'))

#     # Plot the projected 2D points on the PCA plane
#     projected_3d_points = pca.inverse_transform(projected_points)
#     fig.add_trace(go.Scatter3d(
#         x=projected_3d_points[:, 0], y=projected_3d_points[:, 1], z=projected_3d_points[:, 2],
#         mode='markers',
#         marker=dict(size=5, color='green'),
#         name='Projected Points'
#     ))

#     # Plot the major and minor axes
#     major_axis_line = np.array([plane_point - 10 * major_axis, plane_point + 10 * major_axis])
#     minor_axis_line = np.array([plane_point - 10 * minor_axis, plane_point + 10 * minor_axis])

#     fig.add_trace(go.Scatter3d(
#         x=major_axis_line[:, 0], y=major_axis_line[:, 1], z=major_axis_line[:, 2],
#         mode='lines', line=dict(color='red', width=5),
#         name='Major Axis'
#     ))

#     fig.add_trace(go.Scatter3d(
#         x=minor_axis_line[:, 0], y=minor_axis_line[:, 1], z=minor_axis_line[:, 2],
#         mode='lines', line=dict(color='blue', width=5),
#         name='Minor Axis'
#     ))

#     # Compute convex hull
#     hull = ConvexHull(projected_points)
#     hull_edges = projected_points[hull.simplices]

#     # Draw convex hull polygon in thin gray
#     for edge in hull_edges:
#         hull_edge_3d = pca.inverse_transform(edge)  # Convert back to 3D for plotting
#         fig.add_trace(go.Scatter3d(
#             x=hull_edge_3d[:, 0], y=hull_edge_3d[:, 1], z=hull_edge_3d[:, 2],
#             mode='lines',
#             line=dict(color='gray', width=1),
#             name='Convex Hull'
#         ))

#     fig.update_layout(
#         scene=dict(
#             xaxis_title='X',
#             yaxis_title='Y',
#             zaxis_title='Z'
#         ),
#         title='3D Points, PCA Plane, Projections, and Convex Hull',
#         showlegend=True
#     )

#     fig.show()


# # Example usage:
# points = np.array([
#     [0.0, 0.0, 0.0],
#     [2.0, 0.0, 2.0],
#     [20.0, 10.0, 1.0],
#     [18.0, 10.0, 0.0],
# ])

# widthAtCenterOfGravity, lengthAtCenterOfGravity, pca, projected_points = compute_polygon_dimensions(points)

# print(f"Width: {widthAtCenterOfGravity}")
# print(f"Length: {lengthAtCenterOfGravity}")

# # Plot the polygon and PCA results
# plot_polygon_and_pca(points, pca, projected_points)
