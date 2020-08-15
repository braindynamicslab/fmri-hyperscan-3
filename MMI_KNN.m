function MMI = MMI_KNN(X, kk)
% MMI_KNN - Find the multivariate mutual information between m variables using a K-nearest
% neighbor estimator 
% X: N samples x M variables
% kk: k nearest neighbor 
% MMI: multivariate mutual information 
% Author: Oliver (Hua) Xie 2020/02

% Reference:
% Kraskov, Alexander. Synchronization and Interdependence Maesures and their Applications to the
% Electroencephalogram of Epilepsy Patients and Clustering of Data. Diss. Universität Wuppertal,
% Fakultät für Mathematik und Naturwissenschaften» Physik» Dissertationen, 2004.

% Find the distance to kth nearest neighbor in the L_infinity distance (aka
% Chebyshev distance)
[N,M] = size(X); % N samples x M variables
MMI = zeros(1,length(kk));
for ii = 1 : length(kk)
    k = kk(ii);
    [~, xdist] = knnsearch(X,X,'dist', 'chebychev', 'k', k, 'NSMethod', 'kdtree');
    nearest_x = xdist(:,k);
    Nx = zeros(size(X));
    for j = 1 : M
        dX = pdist2(X(:,j),X(:,j),'chebychev');
        for i = 1 : N
            Nx(i,j) = sum(dX(i,:)<nearest_x(i))-1;
        end
    end
    %%%%%%%%%%%%%%%%%%%%
    % Equation 3.35 on Page 18 from Kraskov 2004
    %%%%%%%%%%%%%%%%%%%%
    avg = mean(sum(psi(Nx+1),2));
    MMI(ii) = psi(k) + (M-1)*psi(N) - avg;
end
end
