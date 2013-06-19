package com.ncc.neon.connect
import com.ncc.neon.query.QueryExecutor
import org.springframework.context.annotation.Scope
import org.springframework.context.annotation.ScopedProxyMode
import org.springframework.web.context.WebApplicationContext
/*
 * ************************************************************************
 * Copyright (c), 2013 Next Century Corporation. All Rights Reserved.
 *
 * This software code is the exclusive property of Next Century Corporation and is
 * protected by United States and International laws relating to the protection
 * of intellectual property.  Distribution of this software code by or to an
 * unauthorized party, or removal of any of these notices, is strictly
 * prohibited and punishable by law.
 *
 * UNLESS PROVIDED OTHERWISE IN A LICENSE AGREEMENT GOVERNING THE USE OF THIS
 * SOFTWARE, TO WHICH YOU ARE AN AUTHORIZED PARTY, THIS SOFTWARE CODE HAS BEEN
 * ACQUIRED BY YOU "AS IS" AND WITHOUT WARRANTY OF ANY KIND.  ANY USE BY YOU OF
 * THIS SOFTWARE CODE IS AT YOUR OWN RISK.  ALL WARRANTIES OF ANY KIND, EITHER
 * EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, ARE HEREBY EXPRESSLY
 * DISCLAIMED.
 *
 * PROPRIETARY AND CONFIDENTIAL TRADE SECRET MATERIAL NOT FOR DISCLOSURE OUTSIDE
 * OF NEXT CENTURY CORPORATION EXCEPT BY PRIOR WRITTEN PERMISSION AND WHEN
 * RECIPIENT IS UNDER OBLIGATION TO MAINTAIN SECRECY.
 *
 * 
 * @author tbrooks
 */

/**
 * Holds the current connection. Currently, this holds one connection to a datasource,
 * but can be updated to hold multiple connections or a connection pool..
 */

@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
class ConnectionState implements Serializable{

    private static final long serialVersionUID = 1L

    private transient Connection connection
    private transient QueryExecutor queryExecutor
    private ConnectionInfo info

    void createConnection(ConnectionInfo info){
        if(!info || info == this.info){
            return
        }

        this.info = info
        closeConnection()

        setupConnection(info)
        def client = connection?.connect(info)

        queryExecutor = QueryExecutorFactory.create(client)
    }

    private void setupConnection(ConnectionInfo info){
        if (info.dataSource == ConnectionInfo.DataSource.MONGO){
            connection = new MongoConnection()
        }
        if (info.dataSource == ConnectionInfo.DataSource.HIVE){
            connection = new HiveConnection()
        }
    }

    QueryExecutor getQueryExecutor(){
        queryExecutor
    }

    Object readResolve() throws ObjectStreamException {
        ConnectionState connectionState = new ConnectionState()
        connectionState.createConnection(info)
        return connectionState
    }

    void closeConnection(){
        connection?.close()
    }
}